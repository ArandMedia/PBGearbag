import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '../utils/alert';
import { communityService, Organization, OrganizationClaim, Report } from '../services/community.service';

export default function AdminScreen() {
  const [rows, setRows] = useState<Report[]>([]);
  const [claims, setClaims] = useState<OrganizationClaim[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [bbox, setBbox] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [quality, setQuality] = useState<{ total: number; missingContact: number; missingAddress: number; thinCount: number; thin: Organization[] } | null>(null);
  const [qualityLoading, setQualityLoading] = useState(true);
  const [dedupBusy, setDedupBusy] = useState(false);
  const [dedupResult, setDedupResult] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () =>
    Promise.all([
      communityService.reports(),
      communityService.organizationClaims(),
      communityService.organizations(),
    ])
      .then(([reports, claimRows, orgRows]) => {
        setRows(reports);
        setClaims(claimRows);
        setOrgs(orgRows);
      })
      .finally(() => setLoading(false));

  const loadQuality = () =>
    communityService
      .organizationQualityReport()
      .then(setQuality)
      .finally(() => setQualityLoading(false));

  useEffect(() => {
    void load();
    void loadQuality();
  }, []);

  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name || id.slice(0, 8);

  const decideClaim = async (claimId: string, status: 'approved' | 'declined') => {
    await communityService.decideOrganizationClaim(claimId, status);
    await load();
  };

  const runImport = async () => {
    if (!bbox.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const r = await communityService.importOsmFields(bbox.trim());
      setImportResult(`${r.candidates} candidates — created ${r.created}, updated ${r.updated}, skipped ${r.skipped}.`);
      await load();
      await loadQuality();
    } catch (e: any) {
      setImportResult(e?.response?.data?.message || 'Import failed. Check the bbox format and try again.');
    } finally {
      setImporting(false);
    }
  };

  const runDedup = async () => {
    setDedupBusy(true);
    setDedupResult(null);
    try {
      const r = await communityService.cleanupDuplicateOrganizations();
      setDedupResult(`Found ${r.groups} duplicate group${r.groups === 1 ? '' : 's'} — removed ${r.deleted} extra listing${r.deleted === 1 ? '' : 's'}.`);
      await loadQuality();
    } catch {
      setDedupResult('Cleanup failed. Try again in a moment.');
    } finally {
      setDedupBusy(false);
    }
  };

  const removeThinListing = (id: string, name: string) => {
    Alert.alert('Remove listing', `Delete "${name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await communityService.deleteOrganization(id);
            await loadQuality();
          } catch {
            Alert.alert("Couldn't delete", 'Please try again in a moment.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color="#A8C84A" />
      </View>
    );

  const open = rows.filter((x) => !['resolved', 'dismissed'].includes(x.status));

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.head}>
        <View>
          <Text style={s.kicker}>PBG OPERATIONS</Text>
          <Text style={s.title}>Moderation queue</Text>
          <Text style={s.sub}>Every decision is attributable. Resolve reports consistently and preserve evidence.</Text>
        </View>
        <View style={s.count}>
          <Text style={s.countNum}>{open.length}</Text>
          <Text style={s.countLabel}>OPEN</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Field claims</Text>
      {!claims.length ? (
        <Text style={s.empty}>No pending claim requests.</Text>
      ) : (
        claims.map((c) => (
          <View style={s.card} key={c.id}>
            <Text style={s.subject}>{orgName(c.organizationId)}</Text>
            <Text style={s.body}>Requested by player {c.userId.slice(0, 8)}</Text>
            {c.note ? <Text style={s.body}>"{c.note}"</Text> : null}
            <Text style={s.date}>{new Date(c.createdAt).toLocaleString()}</Text>
            <View style={s.actions}>
              <Pressable style={s.resolve} onPress={() => decideClaim(c.id, 'approved')}>
                <Text style={s.resolveText}>Approve</Text>
              </Pressable>
              <Pressable
                style={s.dismiss}
                onPress={() =>
                  Alert.alert('Decline claim', 'Decline this claim request?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Decline', onPress: () => decideClaim(c.id, 'declined') },
                  ])
                }
              >
                <Text style={s.dismissText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Text style={s.sectionTitle}>Import fields from OpenStreetMap</Text>
      <View style={s.card}>
        <Text style={s.body}>
          Pulls paintball fields tagged in OpenStreetMap within a bounding box into the directory as unclaimed
          listings. Safe to re-run — existing unclaimed listings are refreshed, not duplicated, and claimed
          listings are left alone.
        </Text>
        <TextInput
          style={s.input}
          placeholder="south,west,north,east — e.g. 38.4,-91.0,39.1,-90.0"
          placeholderTextColor="#5f6a73"
          value={bbox}
          onChangeText={setBbox}
        />
        <Pressable style={[s.resolve, (!bbox.trim() || importing) && s.disabled]} onPress={runImport} disabled={!bbox.trim() || importing}>
          {importing ? <ActivityIndicator size="small" color="#10150d" /> : <Text style={s.resolveText}>Run import</Text>}
        </Pressable>
        {importResult && <Text style={s.importResult}>{importResult}</Text>}
      </View>

      <Text style={s.sectionTitle}>Field & vendor data quality</Text>
      <View style={s.card}>
        {qualityLoading ? (
          <ActivityIndicator color="#A8C84A" />
        ) : quality ? (
          <>
            <View style={s.qualityStats}>
              <View style={s.qualityStat}>
                <Text style={s.qualityNum}>{quality.total}</Text>
                <Text style={s.qualityLabel}>TOTAL LISTINGS</Text>
              </View>
              <View style={s.qualityStat}>
                <Text style={s.qualityNum}>{quality.missingContact}</Text>
                <Text style={s.qualityLabel}>NO CONTACT INFO</Text>
              </View>
              <View style={s.qualityStat}>
                <Text style={s.qualityNum}>{quality.missingAddress}</Text>
                <Text style={s.qualityLabel}>NO ADDRESS</Text>
              </View>
            </View>
            <Text style={s.body}>
              Duplicate check groups unclaimed, imported listings by name and location (~500m) and keeps only
              the most complete row in each group.
            </Text>
            <Pressable style={[s.review, dedupBusy && s.disabled]} onPress={runDedup} disabled={dedupBusy}>
              {dedupBusy ? <ActivityIndicator size="small" color="#c6ced4" /> : <Text style={s.reviewText}>Find & remove duplicates</Text>}
            </Pressable>
            {dedupResult && <Text style={s.importResult}>{dedupResult}</Text>}

            {quality.thinCount > 0 && (
              <>
                <Text style={[s.body, { marginTop: 16 }]}>
                  {quality.thinCount} listing{quality.thinCount === 1 ? '' : 's'} with no address, phone, email, or
                  website — nothing for a visitor to act on. Review and remove the ones that aren't worth keeping.
                </Text>
                {quality.thin.map((o) => (
                  <View key={o.id} style={s.thinRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.thinName}>{o.name}</Text>
                      <Text style={s.thinMeta}>
                        {o.type} • {[o.city, o.region].filter(Boolean).join(', ') || 'No location'}
                      </Text>
                    </View>
                    <Pressable
                      style={s.dismiss}
                      onPress={() => removeThinListing(o.id, o.name)}
                      disabled={deletingId === o.id}
                    >
                      {deletingId === o.id ? (
                        <ActivityIndicator size="small" color="#78838c" />
                      ) : (
                        <Text style={s.dismissText}>Delete</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
          <Text style={s.empty}>Couldn't load the quality report.</Text>
        )}
      </View>

      <Text style={s.sectionTitle}>Reports</Text>
      {rows.map((r) => (
        <View style={s.card} key={r.id}>
          <View style={s.cardTop}>
            <Text style={s.category}>{r.category.replace('_', ' ').toUpperCase()}</Text>
            <Text style={[s.status, r.status === 'open' && s.open]}>{r.status.toUpperCase()}</Text>
          </View>
          <Text style={s.subject}>
            {r.subjectType} • {r.subjectId.slice(0, 8)}
          </Text>
          <Text style={s.body}>{r.description}</Text>
          <Text style={s.date}>{new Date(r.createdAt).toLocaleString()}</Text>
          {!['resolved', 'dismissed'].includes(r.status) && (
            <View style={s.actions}>
              <Pressable
                style={s.review}
                onPress={async () => {
                  await communityService.resolveReport(r.id, 'reviewing', 'Assigned for moderation review.');
                  await load();
                }}
              >
                <Text style={s.reviewText}>Start review</Text>
              </Pressable>
              <Pressable
                style={s.resolve}
                onPress={() =>
                  Alert.alert('Resolve report', 'Mark this report resolved after reviewing the evidence?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Resolve',
                      onPress: async () => {
                        await communityService.resolveReport(r.id, 'resolved', 'Reviewed and resolved by moderation.');
                        await load();
                      },
                    },
                  ])
                }
              >
                <Text style={s.resolveText}>Resolve</Text>
              </Pressable>
              <Pressable
                style={s.dismiss}
                onPress={async () => {
                  await communityService.resolveReport(r.id, 'dismissed', 'Reviewed; no policy violation found.');
                  await load();
                }}
              >
                <Text style={s.dismissText}>Dismiss</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0A0E0F' },
  content: { width: '94%', maxWidth: 950, alignSelf: 'center', paddingTop: 28, paddingBottom: 70 },
  center: { flex: 1, backgroundColor: '#0A0E0F', alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  kicker: { color: '#E8743B', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 7 },
  sub: { color: '#84909a', marginTop: 7 },
  count: { backgroundColor: '#22170f', borderWidth: 1, borderColor: '#54301a', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  countNum: { color: '#E8743B', fontSize: 24, fontWeight: '900' },
  countLabel: { color: '#9c6949', fontSize: 8, fontWeight: '900' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 30, marginBottom: 12 },
  empty: { color: '#5f6a73', fontStyle: 'italic', marginBottom: 12 },
  card: { backgroundColor: '#121819', borderWidth: 1, borderColor: '#293139', borderRadius: 18, padding: 20, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  category: { color: '#ff9c5b', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  status: { color: '#74808a', fontSize: 9, fontWeight: '900' },
  open: { color: '#ff6e61' },
  subject: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 12, textTransform: 'capitalize' },
  body: { color: '#a3adb5', lineHeight: 21, marginTop: 8 },
  date: { color: '#5f6a73', fontSize: 10, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 16 },
  review: { borderWidth: 1, borderColor: '#4a555e', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  reviewText: { color: '#c6ced4', fontWeight: '800' },
  resolve: { backgroundColor: '#A8C84A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, alignItems: 'center' },
  resolveText: { color: '#10150d', fontWeight: '900' },
  dismiss: { paddingHorizontal: 13, paddingVertical: 10 },
  dismissText: { color: '#78838c', fontWeight: '800' },
  disabled: { opacity: 0.5 },
  input: {
    backgroundColor: '#171c20',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#364047',
    marginTop: 14,
    marginBottom: 12,
  },
  importResult: { color: '#A8C84A', fontSize: 12, marginTop: 12, fontWeight: '700' },
  qualityStats: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  qualityStat: {
    flex: 1,
    backgroundColor: '#0e1417',
    borderWidth: 1,
    borderColor: '#232b31',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  qualityNum: { color: '#fff', fontSize: 22, fontWeight: '900' },
  qualityLabel: { color: '#66707a', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 4, textAlign: 'center' },
  thinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#232b31',
  },
  thinName: { color: '#e4e8ea', fontSize: 13, fontWeight: '800' },
  thinMeta: { color: '#66707a', fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
});
