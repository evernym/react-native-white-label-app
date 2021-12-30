package com.evernym.sdk.reactnative.mids;

import android.app.AlertDialog;
import android.app.Dialog;
import android.app.DialogFragment;
import android.content.DialogInterface;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.mastercard.dis.mids.base.verification.data.enumeration.MIDSScanSide;
import com.mastercard.dis.mids.base.verification.data.listener.IMidsVerificationScanListener;
import com.mastercard.dis.mids.base.verification.data.model.MIDSVerificationError;
import com.mastercard.dis.mids.base.verification.data.model.MIDSVerificationResponse;
import com.mastercard.dis.mids.base.verification.data.presenter.MIDSVerificationScanPresenter;
import com.mastercard.dis.mids.base.verification.enrollment.MIDSEnrollmentManager;
import com.mastercard.dis.mids.base.verification.views.MIDSVerificationConfirmationView;
import com.mastercard.dis.mids.base.verification.views.MIDSVerificationScanView;

import com.evernym.sdk.reactnative.R;

import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;

public class MIDSScanFragment extends DialogFragment {
    private MIDSEnrollmentManager midsEnrollmentManager;
    private MIDSScanSide midsScanSide;
    private MIDSVerificationConfirmationView midsVerificationConfirmationView = null;
    private MIDSVerificationScanView midsVerificationScanView = null;
    private IMidsVerificationScanListener scanListener = null;
    private MIDSVerificationScanPresenter presenter = null;

    private Button continueButton;
    private Button retryButton;
    private Button closeButton;
    private TextView title;
    private TextView subtitle;

    private DismissListener listener = null;
    private boolean isDestroy = false;

    public static MIDSScanFragment newInstance() {
        return new MIDSScanFragment();
    }

    public void setDismissListener(DismissListener listener) {
        this.listener = listener;
    }

    @Override
    public void onDismiss(DialogInterface dialog) {
        super.onDismiss(dialog);
        if (listener != null) {
            listener.onDismiss(isDestroy);
        }
    }

    @Override
    public void onStart()
    {
        super.onStart();
        Dialog dialog = getDialog();
        if (dialog != null)
        {
            int width = ViewGroup.LayoutParams.MATCH_PARENT;
            int height = ViewGroup.LayoutParams.MATCH_PARENT;
            dialog.getWindow().setLayout(width, height);
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                                      @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_scan, container, false);
        midsVerificationScanView = (MIDSVerificationScanView) view.findViewById(R.id.sv_scan);
        midsVerificationConfirmationView = (MIDSVerificationConfirmationView) view.findViewById(R.id.cv_scan);
        continueButton = (Button) view.findViewById(R.id.btn_scan_continue);
        retryButton = (Button) view.findViewById(R.id.btn_scan_retry);
        closeButton = (Button) view.findViewById(R.id.btn_scan_cancel);
        title = (TextView) view.findViewById(R.id.btn_scan_title);
        subtitle = (TextView) view.findViewById(R.id.btn_scan_subtitle);

        title.setTextColor(Color.rgb(165, 165, 165));
        title.setText("Good job");
        subtitle.setTextColor(Color.rgb(119, 119, 119));
        subtitle.setText("If your document has two sides, flip it over and press continue to scan the back. Otherwise just press continue.");

        continueButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (presenter != null) {
                    presenter.confirmScan();
                }
            }
        });
        continueButton.setVisibility(View.INVISIBLE);

        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                midsVerificationConfirmationView.setVisibility(View.INVISIBLE);
                midsVerificationScanView.setVisibility(View.VISIBLE);
                closeButton.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(255, 255, 255)));
                continueButton.setVisibility(View.INVISIBLE);
                retryButton.setVisibility(View.INVISIBLE);
                if (presenter != null) {
                    presenter.retryScan();
                }
            }
        });
        retryButton.setVisibility(View.INVISIBLE);

        closeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                isDestroy = true;
                if (presenter != null) {
                    presenter.destroy();
                }
                onDestroyView();
            }
        });
        closeButton.setVisibility(View.VISIBLE);
        closeButton.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(255, 255, 255)));

        if (this.midsScanSide == MIDSScanSide.FACE) {
            midsVerificationScanView.setMode(MIDSVerificationScanView.MODE_FACE);
        } else {
            midsVerificationScanView.setMode(MIDSVerificationScanView.MODE_ID);
        }
        scanListener = new ScanListener();

        MIDSVerificationResponse<MIDSVerificationScanPresenter> presenterResponse = midsEnrollmentManager.getPresenter(
            midsScanSide,
            midsVerificationScanView,
            midsVerificationConfirmationView,
            scanListener
        );

        MIDSVerificationError error = presenterResponse.getError();
        if (error != null) {
            System.out.println("MIDSVerificationError" + error.getMessage().toString());
        }

        presenter = presenterResponse.response;
        return view;
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        if (presenter != null) {
            midsVerificationScanView.setVisibility(View.VISIBLE);
            presenter.startScan();
        } else {
            System.out.println("Scan error");
        }
    }

    public void setMIDSEnrollmentManager(MIDSEnrollmentManager midsEnrollmentManager) {
        this.midsEnrollmentManager = midsEnrollmentManager;
    }

    public void setMIDSScanSide(MIDSScanSide midsScanSide) {
        this.midsScanSide = midsScanSide;
    }

    private void showModal() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                new AlertDialog.Builder(getActivity())
                    .setTitle("Сouldn't recognize document. Please try again...")
                    .setPositiveButton("Retry scan", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            presenter.retryScan();
                        }
                    })
                    .setNegativeButton("Finish scan", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            isDestroy = true;
                            presenter.destroy();
                            presenter = null;
                            continueButton.setVisibility(View.INVISIBLE);
                            retryButton.setVisibility(View.VISIBLE);
                            onDestroyView();
                        }
                    })
                    .setIcon(android.R.drawable.ic_dialog_alert)
                    .show();
            }
        });
    }

    private class ScanListener implements IMidsVerificationScanListener {

        @Override
        public void onCameraAvailable() {
            System.out.println("ScanListener - method: onCameraAvailable ");
            presenter.resume();
        }

        @Override
        public void onProcessStarted() {
            System.out.println("ScanListener - method: onProcessStarted ");
        }

        @Override
        public void onDocumentCaptured() {
            System.out.println("ScanListener - method: onDocumentCaptured ");
            title.setVisibility(View.VISIBLE);
            subtitle.setVisibility(View.VISIBLE);
            continueButton.setVisibility(View.VISIBLE);
            retryButton.setVisibility(View.VISIBLE);
            midsVerificationConfirmationView.setVisibility(View.VISIBLE);
            midsVerificationScanView.setVisibility(View.INVISIBLE);
            closeButton.setBackgroundTintList(ColorStateList.valueOf(Color.rgb(119, 119, 119)));
        }

        @Override
        public void onError(MIDSVerificationError error) {
            if (error == MIDSVerificationError.PRESENTER_ERROR_SHOW_BLUR_HINT) {
                System.out.println("ScanListener - method: onError - error: " + error.getMessage());
            } else {
                System.out.println("ScanListener - method: onError - error: " + error.getMessage());
                presenter.destroy();
            }
        }

        @Override
        public void onPreparingScan() {
            System.out.println("ScanListener - method: onPreparingScan ");
        }

        @Override
        public void onProcessCancelled(MIDSVerificationError error) {
            System.out.println("ScanListener - method: onProcessCancelled - error: " + error.getMessage().toString());
            if (error == MIDSVerificationError.PRESENTER_ERROR_GENERIC_ERROR) {
                showModal();
            }
        }

        @Override
        public void onProcessFinished(MIDSScanSide scanSide, boolean allPartsScanned) {
            System.out.println("ScanListener - method: onProcessFinished - scan side: " + scanSide + " - is all parts scanned: " + allPartsScanned);
            presenter.destroy();
            presenter = null;
            continueButton.setVisibility(View.INVISIBLE);
            retryButton.setVisibility(View.VISIBLE);
            onDestroyView();
        }
    }
}
