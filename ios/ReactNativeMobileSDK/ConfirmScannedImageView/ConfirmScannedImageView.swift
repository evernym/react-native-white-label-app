//
//  ConfirmScannedImageView.swift
//  MIDSAssistReferenceApp
//
//  Created by Kalarickal, Jagajith Monappan on 25/02/2021.
//

import UIKit

struct ConfirmScannedImage {
    static let identifier = "ConfirmScannedImageView"
    static let tryAgainButtonCornerRadius = CGFloat(8)
    static let tryAgainButtonBorderWidth = CGFloat(1)
}

class ConfirmScannedImageView: UIView {

    @IBOutlet weak var scannedImagePreviewView: UIView!
    @IBOutlet weak var continueButton: UIButton!
    @IBOutlet weak var tryAgainButton: UIButton!

    private var _confirmationAction: (() -> Void)?
    private var _retakeAction: (() -> Void)?
    
    override func layoutSubviews() {
      setupTryAgaintButton()
    }
    
    func setupTryAgaintButton() {
        tryAgainButton.layer.cornerRadius = ConfirmScannedImage.tryAgainButtonCornerRadius
        tryAgainButton.layer.borderWidth = ConfirmScannedImage.tryAgainButtonBorderWidth
        tryAgainButton.layer.borderColor = UIColor(red: 0.81, green: 0.04, blue: 0.14, alpha: 1.00).cgColor
    }
    
    func addConfirmationHandler(action: (() -> Void)?, confirm: Bool = true) {
        continueButton.isHidden = !confirm
        guard let _ = action else { return }
        _confirmationAction = action
        continueButton.addTarget(self, action: #selector(self.confirmationHandling), for: UIControl.Event.touchUpInside)
    }
    
    func addRetakeHandler(action: (() -> Void)?, retake: Bool = true) {
        tryAgainButton.isHidden = !retake
        guard let _ = action else { return }
        
        _retakeAction = action
        tryAgainButton.addTarget(self, action: #selector(self.retakeHandling), for: UIControl.Event.touchUpInside)
    }
    
    @objc func confirmationHandling() {
        guard let _ = _confirmationAction else { return }
        _confirmationAction!()
    }
    
    @objc func retakeHandling() {
        guard let _ = _retakeAction else { return }
        _retakeAction!()
        self.removeFromSuperview()
    }
}

