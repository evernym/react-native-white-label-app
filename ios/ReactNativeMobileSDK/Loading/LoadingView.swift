import UIKit
import Gifu

struct LoadingViewConstants {
    static let identifier = "LoadingView"
    static let tag = 100
    static let imageName = "loading"
}

class LoadingView: UIView {
    
    @IBOutlet var contentView: UIView!
    @IBOutlet weak var transparentBackgroundView: UIView!
    @IBOutlet weak var loadingWithMessageView: UIView!
    @IBOutlet weak var loadingWithoutMessageView: UIView!
    @IBOutlet weak var loaderImageViewInView: GIFImageView!
    @IBOutlet weak var loaderImageView: GIFImageView!
    @IBOutlet weak var primaryMessageLabel: UILabel!
    @IBOutlet weak var secondaryMessageLabel: UILabel!
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        commomInit()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commomInit()
    }
    
    private func commomInit() {
        Bundle.main.loadNibNamed(LoadingViewConstants.identifier, owner: self, options: nil)
        addSubview(contentView)
        contentView.frame = self.bounds
        transparentBackgroundView.frame = self.bounds
        primaryMessageLabel.text = nil
        secondaryMessageLabel.text = nil
        loadingWithMessageView.isHidden = true
        loadingWithoutMessageView.isHidden = true
        contentView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    }
}
