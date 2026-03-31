import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ReportData } from '@/services/reportService'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  classificationBanner: {
    backgroundColor: '#dc2626',
    padding: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
  classificationText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    width: 120,
  },
  metaValue: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    marginBottom: 8,
    textAlign: 'justify',
  },
  highlightCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  highlightTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    flex: 1,
  },
  severityBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    color: '#ffffff',
  },
  highlightSource: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 4,
  },
  highlightSummary: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#475569',
    marginBottom: 4,
  },
  highlightRelevance: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#1e40af',
    fontFamily: 'Helvetica-Oblique',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    flex: 1,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sourceChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 4,
  },
  sourceLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  sourceCount: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
  },
})

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
}

function formatDateRange(from: string, to: string): string {
  try {
    const f = new Date(from).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const t = new Date(to).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${f} — ${t}`
  } catch {
    return `${from} — ${to}`
  }
}

interface ReportPDFProps {
  data: ReportData
}

export function ReportPDF({ data }: ReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Classification Banner */}
        <View style={styles.classificationBanner}>
          <Text style={styles.classificationText}>
            OSINT BRIEFING
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>OSINT Briefing</Text>
        <Text style={styles.subtitle}>
          {formatDateRange(data.from_datetime, data.to_datetime)}
        </Text>

        {/* Metadata */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Generated:</Text>
          <Text style={styles.metaValue}>
            {new Date(data.generated_at).toLocaleString()}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Events Analyzed:</Text>
          <Text style={styles.metaValue}>{data.event_count}</Text>
        </View>

        {/* Sources Breakdown */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Sources:</Text>
          <View style={[styles.sourcesGrid, { flex: 1 }]}>
            {Object.entries(data.sources_breakdown).map(([src, count]) => (
              <View key={src} style={styles.sourceChip}>
                <Text style={styles.sourceLabel}>{src}</Text>
                <Text style={styles.sourceCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Executive Summary */}
        {data.executive_summary && (
          <View>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            {data.executive_summary.split('\n').map((para, i) =>
              para.trim() ? (
                <Text key={i} style={styles.paragraph}>
                  {para.trim()}
                </Text>
              ) : null,
            )}
          </View>
        )}

        {/* Analysis */}
        {data.analysis && (
          <View>
            <Text style={styles.sectionTitle}>Analysis</Text>
            {data.analysis.split('\n').map((para, i) =>
              para.trim() ? (
                <Text key={i} style={styles.paragraph}>
                  {para.trim()}
                </Text>
              ) : null,
            )}
          </View>
        )}

        {/* Recommendations */}
        {data.recommendations && (
          <View>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {data.recommendations.split('\n').map((line, i) =>
              line.trim() ? (
                <View key={i} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{line.trim()}</Text>
                </View>
              ) : null,
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by Global Watch — Pakistan National Security Division
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Highlights on separate page if present */}
      {data.highlights && data.highlights.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.classificationBanner}>
            <Text style={styles.classificationText}>
              HIGHLIGHTS
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Key Highlights</Text>

          {data.highlights.map((h, i) => (
            <View key={i} style={styles.highlightCard} wrap={false}>
              <View style={styles.highlightHeader}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        SEVERITY_COLORS[h.severity?.toLowerCase()] || '#64748b',
                    },
                  ]}
                >
                  {(h.severity || 'N/A').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.highlightSource}>Source: {h.source}</Text>
              <Text style={styles.highlightSummary}>{h.summary}</Text>
              <Text style={styles.highlightRelevance}>
                Pakistan Relevance: {h.pakistan_relevance}
              </Text>
            </View>
          ))}

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              Generated by Global Watch — Pakistan National Security Division
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </Page>
      )}
    </Document>
  )
}
