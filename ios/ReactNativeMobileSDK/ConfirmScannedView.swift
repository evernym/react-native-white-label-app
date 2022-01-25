//
//  ConfirmScannedView.swift
//  react-native-white-label-app
//
//  Created by Andrey Shevchenko on 12/14/21.
//

import Foundation
import UIKit

class ConfirmScannedView {
    var container: UIView!
    var title: UILabel!
    var subtitle: UILabel!
    var continueButton: UIButton!
    var tryAgainButton: UIButton!

    private var _confirmationAction: (() -> Void)?
    private var _retakeAction: (() -> Void)?

    func inflate() {
        let window = UIApplication.shared.keyWindow!
        self.container = UIView(frame: window.bounds)
        self.container.backgroundColor = .white
        self.container.frame = window.bounds

        self.addTitle()
        self.addSubtitle()
        self.addContinueButton()
        self.addTryAgainButton()
    }

    func getView() -> UIView {
        return self.container
    }

    func addTitle() {
        self.title = UILabel(frame: CGRect(x: 0, y: 50, width: self.container.frame.width, height: 25))
        self.title.center.x = self.container.center.x
        self.title.text = "Good job"
        self.title.textAlignment = .center
        self.title.textColor = .black
        self.title.font = self.title.font.withSize(22)
        self.container.addSubview(self.title)
    }

    func addSubtitle() {
        self.subtitle = UILabel(frame: CGRect(x: 0, y: 90, width: self.container.frame.width - 50, height: 50))
        self.subtitle.center.x = self.container.center.x
        self.subtitle.text = "Scan back side of your document If you see back camera in next screen"
        self.subtitle.textAlignment = .center
        self.subtitle.textColor = .black
        self.subtitle.font = self.subtitle.font.withSize(18)
        self.subtitle.lineBreakMode = .byWordWrapping
        self.subtitle.numberOfLines = 2
        self.container.addSubview(self.subtitle)
    }

    func addContinueButton() {
        self.continueButton = UIButton(
            frame: CGRect(x: 0, y: self.container.frame.height - 125, width: 250, height: 50))
        self.continueButton.center.x = self.container.center.x
        self.continueButton.backgroundColor = UIColor(
            red: 145.0 / 255.0,
            green: 183.0 / 255.0,
            blue: 78.0 / 255.0,
            alpha: 1.0)
        self.continueButton.setTitle("Continue", for: .normal)
        self.continueButton.setTitleColor(.white, for: .normal)
    }

    func addTryAgainButton() {
        self.tryAgainButton = UIButton(
            frame: CGRect(x: 0, y: self.container.frame.height - 75, width: 250, height: 50))
        self.tryAgainButton.center.x = self.container.center.x
        self.tryAgainButton.backgroundColor = .red
        self.tryAgainButton.backgroundColor = .white
        self.tryAgainButton.setTitle("Try again", for: .normal)
        self.tryAgainButton.setTitleColor(.red, for: .normal)
    }

    func addConfirmationHandler(action: (() -> Void)?, confirm: Bool = true) {
        self.continueButton.isHidden = !confirm
        guard let _ = action else { return }
        self._confirmationAction = action
        self.continueButton.addTarget(
            self,
            action: #selector(self.confirmationHandling),
            for: UIControl.Event.touchUpInside)

        self.container.addSubview(self.continueButton)
    }

    func addRetakeHandler(action: (() -> Void)?, retake: Bool = true) {
        self.tryAgainButton.isHidden = !retake
        guard let _ = action else { return }
        self._retakeAction = action
        self.tryAgainButton.addTarget(
            self,
            action: #selector(self.retakeHandling),
            for: UIControl.Event.touchUpInside)

        self.container.addSubview(self.tryAgainButton)
    }

    @objc func confirmationHandling() {
        guard let _ = _confirmationAction else { return }
        self._confirmationAction!()
    }

    @objc func retakeHandling() {
        guard let _ = _retakeAction else { return }
        self._retakeAction!()
    }

    func removeFromSuperview() {
        self.container.removeFromSuperview()
    }
}
