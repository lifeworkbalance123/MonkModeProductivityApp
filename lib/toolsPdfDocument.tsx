import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import {
  SECTION_ORDER,
  toolsData,
  type Tool,
  type ToolSection,
} from '@/lib/toolsContent'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    marginTop: 14,
    marginBottom: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  toolBlock: {
    marginBottom: 10,
  },
  toolName: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  purpose: {
    fontSize: 9,
    marginBottom: 4,
    color: '#334155',
  },
  label: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    marginTop: 3,
    color: '#475569',
  },
  bullet: {
    fontSize: 8,
    marginLeft: 8,
    marginBottom: 2,
    color: '#334155',
  },
  example: {
    fontSize: 8,
    marginTop: 3,
    fontStyle: 'italic',
    color: '#64748b',
  },
  link: {
    fontSize: 8,
    color: '#2563eb',
    marginTop: 2,
  },
})

function toolsBySection(): Record<ToolSection, Tool[]> {
  const map = {} as Record<ToolSection, Tool[]>
  for (const s of SECTION_ORDER) {
    map[s] = []
  }
  for (const t of toolsData) {
    map[t.section].push(t)
  }
  return map
}

export function ToolsPdfDocument() {
  const bySection = toolsBySection()
  const dateStr = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document
      title="MonkCubed Tool Library"
      author="MonkCubed"
      subject="Productivity suite quick reference"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>MonkCubed Tool Library</Text>
        <Text style={styles.subtitle}>
          Quick reference — generated {dateStr}. For the latest UI, use the in-app /tools page.
        </Text>

        {SECTION_ORDER.map((section) => (
          <View key={section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            {bySection[section].map((tool) => (
              <View key={tool.id} style={styles.toolBlock}>
                <Text style={styles.toolName}>
                  {tool.name}
                </Text>
                <Text style={styles.purpose}>{tool.purpose}</Text>
                <Text style={styles.label}>When to use</Text>
                {tool.whenToUse.map((line, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {line}
                  </Text>
                ))}
                <Text style={styles.label}>How to use</Text>
                {tool.howToUse.map((line, i) => (
                  <Text key={i} style={styles.bullet}>
                    {i + 1}. {line}
                  </Text>
                ))}
                <Text style={styles.example}>Example: {tool.example}</Text>
                {tool.link ? (
                  <Text style={styles.link}>Link: {tool.link}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}
