import Foundation
import WatchConnectivity

@objc(MonkModeWatchSync)
class MonkModeWatchSync: NSObject, WCSessionDelegate {
    private let session = WCSession.default

    override init() {
        super.init()
        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
        }
    }

    @objc
    func updateApplicationContext(_ payload: [String: Any]) {
        do {
            try session.updateApplicationContext(payload)
        } catch {
            // No-op in scaffold mode.
        }
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}

    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {}
}

