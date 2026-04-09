import WidgetKit
import SwiftUI

struct MonkModeEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let habitsCompleted: Int
    let habitsTotal: Int
    let topGoal: String
    let hasData: Bool
}

struct MonkModeProvider: TimelineProvider {
    private let appGroupId = "group.com.monkmode.shared"
    private let key = "monkmode_widget_data"

    func placeholder(in context: Context) -> MonkModeEntry {
        MonkModeEntry(date: Date(), streak: 0, habitsCompleted: 0, habitsTotal: 0, topGoal: "", hasData: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (MonkModeEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MonkModeEntry>) -> Void) {
        let entry = loadEntry()
        let refresh = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }

    private func loadEntry() -> MonkModeEntry {
        guard
            let defaults = UserDefaults(suiteName: appGroupId),
            let json = defaults.string(forKey: key),
            let data = json.data(using: .utf8),
            let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return MonkModeEntry(date: Date(), streak: 0, habitsCompleted: 0, habitsTotal: 0, topGoal: "", hasData: false)
        }

        return MonkModeEntry(
            date: Date(),
            streak: payload["streak"] as? Int ?? 0,
            habitsCompleted: payload["habitsCompleted"] as? Int ?? 0,
            habitsTotal: payload["habitsTotal"] as? Int ?? 0,
            topGoal: payload["topGoal"] as? String ?? "",
            hasData: true
        )
    }
}

struct MonkModeWidgetEntryView: View {
    var entry: MonkModeProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if !entry.hasData {
            ZStack {
                Color(hex: "#111827")
                Text("Open MonkMode to get started")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding()
            }
        } else if family == .systemSmall {
            smallView
        } else {
            mediumView
        }
    }

    private var smallView: some View {
        ZStack(alignment: .bottomTrailing) {
            Color(hex: "#111827")
            VStack(alignment: .leading, spacing: 2) {
                Text("🔥").font(.system(size: 24))
                Text("\(entry.streak)")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.white)
                Text("Day streak")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "#F59E0B"))
                Spacer(minLength: 0)
            }
            .padding(12)

            Text("MONKMODE")
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(Color(hex: "#6B7280"))
                .padding(10)
        }
        .widgetURL(URL(string: "monkmode://dashboard"))
    }

    private var mediumView: some View {
        HStack(spacing: 8) {
            smallView.frame(width: 120)
            VStack(alignment: .leading, spacing: 8) {
                Text("Today's habits")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: "#F59E0B"))
                Text("\(entry.habitsCompleted) / \(entry.habitsTotal) done")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.white)
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(hex: "#374151"))
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(hex: "#F59E0B"))
                        .frame(width: progressWidth, height: 8)
                }
                if !entry.topGoal.isEmpty {
                    Text("Top goal: \(entry.topGoal)")
                        .font(.system(size: 10, weight: .regular))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 12)
            .padding(.trailing, 12)
        }
        .background(Color(hex: "#111827"))
        .widgetURL(URL(string: "monkmode://dashboard"))
    }

    private var progressWidth: CGFloat {
        guard entry.habitsTotal > 0 else { return 0 }
        let pct = CGFloat(entry.habitsCompleted) / CGFloat(entry.habitsTotal)
        return max(0, min(1, pct)) * 120
    }
}

@main
struct MonkModeWidget: Widget {
    let kind: String = "MonkModeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MonkModeProvider()) { entry in
            MonkModeWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("MonkMode")
        .description("Track your streak and today's habit progress.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255.0
        let g = Double((int >> 8) & 0xFF) / 255.0
        let b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

