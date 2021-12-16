//
//  LoaderView.swift
//  react-native-white-label-app
//
//  Created by Andrey Shevchenko on 12/14/21.
//

import Foundation
import UIKit

class LoaderView {
    var container: UIView!

    var loadingIndicator: UIActivityIndicatorView!
    var messageLabel: UILabel!
    
    func inflate() {
        let window = UIApplication.shared.keyWindow!
        self.container = UIView(frame: window.bounds)
        self.container.backgroundColor = .white
        self.container.frame = window.bounds
        self.container.tag = 100
        
        self.addActivityIndicator()
        self.addTitle()
    }
    
    func addActivityIndicator() {
        self.loadingIndicator = UIActivityIndicatorView(frame:CGRect(
                                                    x: 0,
                                                    y: self.container.center.y - 50,
                                                    width: 100,
                                                    height: 100))
        self.loadingIndicator.center.x = self.container.center.x
        self.loadingIndicator.hidesWhenStopped = true
        self.loadingIndicator.startAnimating()
        self.loadingIndicator.color = .black
        self.loadingIndicator.transform = CGAffineTransform(scaleX: 1.5, y: 1.5)
        self.container.addSubview(self.loadingIndicator)
    }
    
    func addTitle() {
        self.messageLabel = UILabel(frame: CGRect(
                                    x: 0,
                                    y: self.container.center.y + 50,
                                    width: self.container.frame.width,
                                    height: 20))
        self.messageLabel.center.x = self.container.center.x
        self.messageLabel.text = "Processing..."
        self.messageLabel.textAlignment = .center
        self.messageLabel.textColor = .black
        self.messageLabel.font = self.messageLabel.font.withSize(18)
        self.container.addSubview(self.messageLabel)
    }
    
    func getView() -> UIView {
        return self.container
    }
}
