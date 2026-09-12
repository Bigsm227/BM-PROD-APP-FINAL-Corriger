import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LogOut, Trash2, Film, Music4, Disc3 } from "lucide-react-native";

import {
  createBeat,
  createProject,
  deleteBeat,
  deleteProject,
  getAdminBeats,
  getAdminProjects,
  type Beat,
  type Project,
} from "@/src/api";
import { useAuth } from "@/src/auth";
import { Field, GhostButton, Loader, PrimaryButton } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const TABS = [
  { key: "projects", label: "Réalisations", icon: Film },
  { key: "beats", label: "Instrumentales", icon: Music4 },
] as const;

export default function AdminDashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const { token, ready, logout } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("projects");

  useEffect(() => {
    if (ready && !token) router.replace("/admin/login");
  }, [ready, token, router]);

  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => getAdminProjects(token!),
    enabled: !!token,
  });
  const beats = useQuery({ queryKey: ["admin-beats"], queryFn: () => getAdminBeats(token!), enabled: !!token });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
    qc.invalidateQueries({ queryKey: ["admin-beats"] });
    qc.invalidateQueries({ queryKey: ["portfolio"] });
    qc.invalidateQueries({ queryKey: ["beats"] });
  };

  const delProject = useMutation({
    mutationFn: (id: string) => deleteProject(token!, id),
    onSuccess: () => {
      invalidate();
      toast("Projet supprimé", "success");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });
  const delBeat = useMutation({
    mutationFn: (id: string) => deleteBeat(token!, id),
    onSuccess: () => {
      invalidate();
      toast("Instrumentale supprimée", "success");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const doLogout = async () => {
    await logout();
    router.replace("/(tabs)");
  };

  if (!ready || !token) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Administration</Text>
            <Text style={styles.headerSub}>Big S Media Production</Text>
          </View>
          <Pressable testID="admin-logout-button" onPress={doLogout} hitSlop={12} style={styles.logoutBtn}>
            <LogOut color={colors.onSurfaceTertiary} size={18} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{projects.data?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Réalisations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{beats.data?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Instrumentales</Text>
          </View>
        </View>

        <View style={styles.segment}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              testID={`admin-tab-${t.key}`}
              onPress={() => setTab(t.key)}
              style={[styles.segmentItem, tab === t.key && styles.segmentActive]}
            >
              <t.icon color={tab === t.key ? colors.onBrandPrimary : colors.onSurfaceTertiary} size={15} />
              <Text style={[styles.segmentText, tab === t.key && styles.segmentTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {tab === "projects" ? (
          <ProjectsManager
            projects={projects.data ?? []}
            loading={projects.isLoading}
            onDelete={(id) => delProject.mutate(id)}
            token={token}
            onCreated={invalidate}
          />
        ) : (
          <BeatsManager
            beats={beats.data ?? []}
            loading={beats.isLoading}
            onDelete={(id) => delBeat.mutate(id)}
            token={token}
            onCreated={invalidate}
          />
        )}
      </ScrollView>
    </View>
  );
}

function ProjectsManager({
  projects,
  loading,
  onDelete,
  token,
  onCreated,
}: {
  projects: Project[];
  loading: boolean;
  onDelete: (id: string) => void;
  token: string;
  onCreated: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [year, setYear] = useState("");

  const createMut = useMutation({
    mutationFn: () => createProject(token, { title, category, description, image_url: imageUrl, year, published: true }),
    onSuccess: () => {
      toast("Projet ajouté", "success");
      setTitle("");
      setCategory("");
      setDescription("");
      setImageUrl("");
      setYear("");
      setOpen(false);
      onCreated();
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const canCreate = title.trim() && category.trim() && description.trim() && imageUrl.trim();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {!open ? (
        <PrimaryButton testID="add-project-button" label="+ Ajouter une réalisation" onPress={() => setOpen(true)} style={{ marginBottom: 16 }} />
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nouvelle réalisation</Text>
          <Field label="Titre" testID="project-title-input" value={title} onChangeText={setTitle} placeholder="Titre du projet" />
          <Field label="Catégorie" testID="project-category-input" value={category} onChangeText={setCategory} placeholder="Clip, Publicité..." />
          <Field label="Année" testID="project-year-input" value={year} onChangeText={setYear} placeholder="2025" />
          <Field
            label="URL de l'image"
            testID="project-image-input"
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            autoCapitalize="none"
          />
          <Field
            label="Description"
            testID="project-desc-input"
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez le projet..."
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: "top", paddingTop: 14 }}
          />
          <View style={{ gap: 10 }}>
            <PrimaryButton
              testID="project-create-button"
              label="Publier"
              onPress={() => (canCreate ? createMut.mutate() : toast("Remplissez tous les champs.", "error"))}
              loading={createMut.isPending}
              disabled={!canCreate}
            />
            <GhostButton testID="project-cancel-button" label="Annuler" onPress={() => setOpen(false)} />
          </View>
        </View>
      )}

      {loading ? (
        <Loader />
      ) : projects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune réalisation. Ajoutez-en une.</Text>
        </View>
      ) : (
        projects.map((p) => (
          <View key={p.id} style={styles.row} testID={`admin-project-${p.id}`}>
            <Image source={{ uri: p.image_url }} style={styles.thumb} contentFit="cover" />
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {p.title}
              </Text>
              <Text style={styles.rowMeta}>
                {p.category}
                {p.year ? ` · ${p.year}` : ""}
              </Text>
            </View>
            <Pressable testID={`delete-project-${p.id}`} onPress={() => onDelete(p.id)} hitSlop={10} style={styles.delBtn}>
              <Trash2 color={colors.onError} size={18} />
            </Pressable>
          </View>
        ))
      )}
    </KeyboardAvoidingView>
  );
}

function BeatsManager({
  beats,
  loading,
  onDelete,
  token,
  onCreated,
}: {
  beats: Beat[];
  loading: boolean;
  onDelete: (id: string) => void;
  token: string;
  onCreated: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [tempo, setTempo] = useState("");

  const createMut = useMutation({
    mutationFn: () => createBeat(token, { title, genre, tempo, published: true }),
    onSuccess: () => {
      toast("Instrumentale ajoutée", "success");
      setTitle("");
      setGenre("");
      setTempo("");
      setOpen(false);
      onCreated();
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const canCreate = title.trim() && genre.trim() && tempo.trim();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {!open ? (
        <PrimaryButton testID="add-beat-button" label="+ Ajouter une instrumentale" onPress={() => setOpen(true)} style={{ marginBottom: 16 }} />
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nouvelle instrumentale</Text>
          <Field label="Titre" testID="beat-title-input" value={title} onChangeText={setTitle} placeholder="Ex. Afro Zouk Love Vol. 1" />
          <Field label="Genre" testID="beat-genre-input" value={genre} onChangeText={setGenre} placeholder="Ex. Afro Zouk" />
          <Field label="Tempo" testID="beat-tempo-input" value={tempo} onChangeText={setTempo} placeholder="Ex. 95 BPM" />
          <View style={{ gap: 10 }}>
            <PrimaryButton
              testID="beat-create-button"
              label="Publier"
              onPress={() => (canCreate ? createMut.mutate() : toast("Remplissez tous les champs.", "error"))}
              loading={createMut.isPending}
              disabled={!canCreate}
            />
            <GhostButton testID="beat-cancel-button" label="Annuler" onPress={() => setOpen(false)} />
          </View>
        </View>
      )}

      {loading ? (
        <Loader />
      ) : beats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune instrumentale. Ajoutez-en une.</Text>
        </View>
      ) : (
        beats.map((b) => (
          <View key={b.id} style={styles.row} testID={`admin-beat-${b.id}`}>
            <View style={styles.beatCover}>
              <Disc3 color={colors.onBrandPrimary} size={22} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {b.title}
              </Text>
              <Text style={styles.rowMeta}>
                {b.genre} · {b.tempo}
              </Text>
            </View>
            <Pressable testID={`delete-beat-${b.id}`} onPress={() => onDelete(b.id)} hitSlop={10} style={styles.delBtn}>
              <Trash2 color={colors.onError} size={18} />
            </Pressable>
          </View>
        ))
      )}
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 30 },
  headerSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 2,
  },
  statValue: { color: colors.brandPrimary, fontFamily: fonts.displayBold, fontSize: 30 },
  statLabel: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 11 },
  segment: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: 12, padding: 4 },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: { backgroundColor: colors.brandPrimary },
  segmentText: { color: colors.onSurfaceTertiary, fontFamily: fonts.medium, fontSize: 13 },
  segmentTextActive: { color: colors.onBrandPrimary, fontFamily: fonts.semiBold },
  scroll: { padding: 20, gap: 14 },
  formCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  formTitle: { color: colors.onSurface, fontFamily: fonts.displaySemiBold, fontSize: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceTertiary },
  beatCover: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, gap: 2 },
  rowTitle: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 15 },
  rowMeta: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 12 },
  delBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
  },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, textAlign: "center" },
}));
