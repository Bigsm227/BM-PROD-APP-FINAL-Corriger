import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LogOut, Trash2, Inbox, Calendar, Film } from "lucide-react-native";

import {
  createProject,
  deleteProject,
  getAdminAppointments,
  getAdminProjects,
  getAdminQuotes,
  getStats,
  updateAppointmentStatus,
  updateQuoteStatus,
  type Appointment,
  type Project,
  type Quote,
} from "@/src/api";
import { useAuth } from "@/src/auth";
import { Field, GhostButton, Loader, PrimaryButton } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const TABS = [
  { key: "quotes", label: "Demandes", icon: Inbox },
  { key: "appointments", label: "RDV", icon: Calendar },
  { key: "projects", label: "Projets", icon: Film },
] as const;

const QUOTE_FLOW: Record<string, string> = { nouveau: "en_cours", en_cours: "traite", traite: "nouveau" };
const QUOTE_LABEL: Record<string, string> = { nouveau: "Nouveau", en_cours: "En cours", traite: "Traité" };
const APPT_FLOW: Record<string, string> = { en_attente: "confirme", confirme: "annule", annule: "en_attente" };
const APPT_LABEL: Record<string, string> = { en_attente: "En attente", confirme: "Confirmé", annule: "Annulé" };

export default function AdminDashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const { token, ready, logout } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("quotes");

  useEffect(() => {
    if (ready && !token) router.replace("/admin/login");
  }, [ready, token, router]);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => getStats(token!), enabled: !!token });
  const quotes = useQuery({ queryKey: ["admin-quotes"], queryFn: () => getAdminQuotes(token!), enabled: !!token });
  const appts = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => getAdminAppointments(token!),
    enabled: !!token,
  });
  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => getAdminProjects(token!),
    enabled: !!token,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
    qc.invalidateQueries({ queryKey: ["portfolio"] });
  };

  const quoteMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateQuoteStatus(token!, id, status),
    onSuccess: invalidateAll,
    onError: (e: Error) => toast(e.message, "error"),
  });
  const apptMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointmentStatus(token!, id, status),
    onSuccess: invalidateAll,
    onError: (e: Error) => toast(e.message, "error"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteProject(token!, id),
    onSuccess: () => {
      invalidateAll();
      toast("Projet supprimé", "success");
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
            <Text style={styles.headerTitle}>Tableau de bord</Text>
            <Text style={styles.headerSub}>Big S Media Production</Text>
          </View>
          <Pressable testID="admin-logout-button" onPress={doLogout} hitSlop={12} style={styles.logoutBtn}>
            <LogOut color={colors.onSurfaceTertiary} size={18} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Demandes" value={stats.data?.new_quotes ?? 0} total={stats.data?.quotes ?? 0} />
          <StatCard label="RDV" value={stats.data?.pending_appointments ?? 0} total={stats.data?.appointments ?? 0} />
          <StatCard label="Projets" value={stats.data?.projects ?? 0} total={stats.data?.projects ?? 0} single />
        </View>

        {/* Segment */}
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
        {tab === "quotes" &&
          (quotes.isLoading ? (
            <Loader />
          ) : (quotes.data ?? []).length === 0 ? (
            <Empty text="Aucune demande de devis pour l'instant." />
          ) : (
            (quotes.data ?? []).map((q: Quote) => (
              <View key={q.id} style={styles.card} testID={`admin-quote-${q.id}`}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{q.name}</Text>
                  <StatusPill
                    label={QUOTE_LABEL[q.status] ?? q.status}
                    status={q.status}
                    onPress={() => quoteMut.mutate({ id: q.id, status: QUOTE_FLOW[q.status] ?? "nouveau" })}
                    testID={`quote-status-${q.id}`}
                  />
                </View>
                <Text style={styles.cardMeta}>
                  {q.email}
                  {q.phone ? ` · ${q.phone}` : ""}
                </Text>
                <Text style={styles.cardBadge}>
                  {q.service_type}
                  {q.budget ? ` · ${q.budget}` : ""}
                </Text>
                <Text style={styles.cardBody}>{q.message}</Text>
              </View>
            ))
          ))}

        {tab === "appointments" &&
          (appts.isLoading ? (
            <Loader />
          ) : (appts.data ?? []).length === 0 ? (
            <Empty text="Aucun rendez-vous demandé." />
          ) : (
            (appts.data ?? []).map((a: Appointment) => (
              <View key={a.id} style={styles.card} testID={`admin-appt-${a.id}`}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{a.name}</Text>
                  <StatusPill
                    label={APPT_LABEL[a.status] ?? a.status}
                    status={a.status}
                    onPress={() => apptMut.mutate({ id: a.id, status: APPT_FLOW[a.status] ?? "en_attente" })}
                    testID={`appt-status-${a.id}`}
                  />
                </View>
                <Text style={styles.cardMeta}>
                  {a.email}
                  {a.phone ? ` · ${a.phone}` : ""}
                </Text>
                <Text style={styles.cardBadge}>
                  {a.service_type} · {a.date} à {a.time}
                </Text>
                {a.notes ? <Text style={styles.cardBody}>{a.notes}</Text> : null}
              </View>
            ))
          ))}

        {tab === "projects" && (
          <ProjectsManager
            projects={projects.data ?? []}
            loading={projects.isLoading}
            onDelete={(id) => delMut.mutate(id)}
            token={token}
            onCreated={invalidateAll}
          />
        )}
      </ScrollView>
    </View>
  );

  function StatCard({ label, value, total, single }: { label: string; value: number; total: number; single?: boolean }) {
    return (
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>
          {single ? label : `${label} · ${total}`}
        </Text>
      </View>
    );
  }

  function StatusPill({
    label,
    status,
    onPress,
    testID,
  }: {
    label: string;
    status: string;
    onPress: () => void;
    testID: string;
  }) {
    const bg =
      status === "traite" || status === "confirme"
        ? colors.success
        : status === "annule"
          ? colors.error
          : colors.warning;
    const fg =
      status === "traite" || status === "confirme"
        ? colors.onSuccess
        : status === "annule"
          ? colors.onError
          : colors.onWarning;
    return (
      <Pressable testID={testID} onPress={onPress} style={[styles.pill, { backgroundColor: bg }]}>
        <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
      </Pressable>
    );
  }

  function Empty({ text }: { text: string }) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{text}</Text>
      </View>
    );
  }
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
    mutationFn: () =>
      createProject(token, { title, category, description, image_url: imageUrl, year, published: true }),
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
        <PrimaryButton
          testID="add-project-button"
          label="+ Ajouter un projet"
          onPress={() => setOpen(true)}
          style={{ marginBottom: 16 }}
        />
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nouveau projet</Text>
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
              label="Publier le projet"
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
          <Text style={styles.emptyText}>Aucun projet. Ajoutez-en un.</Text>
        </View>
      ) : (
        projects.map((p) => (
          <View key={p.id} style={styles.projectRow} testID={`admin-project-${p.id}`}>
            <Image source={{ uri: p.image_url }} style={styles.projectThumb} contentFit="cover" />
            <View style={styles.projectInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {p.title}
              </Text>
              <Text style={styles.cardBadge}>
                {p.category}
                {p.year ? ` · ${p.year}` : ""}
              </Text>
            </View>
            <Pressable
              testID={`delete-project-${p.id}`}
              onPress={() => onDelete(p.id)}
              hitSlop={10}
              style={styles.delBtn}
            >
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
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { color: colors.onSurface, fontFamily: fonts.semiBold, fontSize: 16, flex: 1 },
  cardMeta: { color: colors.onSurfaceTertiary, fontFamily: fonts.regular, fontSize: 13 },
  cardBadge: { color: colors.brandPrimary, fontFamily: fonts.medium, fontSize: 12 },
  cardBody: { color: colors.onSurfaceSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginTop: 2 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontFamily: fonts.semiBold, fontSize: 12 },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, textAlign: "center" },
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
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  projectThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceTertiary },
  projectInfo: { flex: 1, gap: 2 },
  delBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
  },
}));
