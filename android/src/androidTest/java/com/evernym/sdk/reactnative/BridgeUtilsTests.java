package com.evernym.sdk.reactnative;

/**
 * Created by abdussami on 08/06/18.
 */

import android.Manifest;
import android.os.Environment;
import android.util.Log;

import androidx.test.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.SmallTest;
import androidx.test.rule.GrantPermissionRule;

import junit.framework.Assert;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.RuleChain;
import org.junit.runner.RunWith;

import java.io.File;

import static com.evernym.sdk.reactnative.BridgeUtils.generateCaCertContents;
import static com.evernym.sdk.reactnative.BridgeUtils.writeCACert;

@RunWith(AndroidJUnit4.class)
@SmallTest
public class BridgeUtilsTests {
    public GrantPermissionRule readPermissionRule = GrantPermissionRule.grant(Manifest.permission.READ_EXTERNAL_STORAGE);

    public GrantPermissionRule writePermissionRule = GrantPermissionRule.grant(Manifest.permission.WRITE_EXTERNAL_STORAGE);


    @Rule
    public final RuleChain mRuleChain = RuleChain.outerRule(readPermissionRule)
            .around(writePermissionRule);
    String TAG = "BRIDGE TESTS::";

    @Before
    public void cleanup(){
        File f = new File(Environment.getExternalStorageDirectory().getPath() + "/cacert.pem");
        f.delete();

    }

    @Test
    public void caCertTest() throws InterruptedException {



        String certContents = generateCaCertContents();
        Log.i(TAG, "caCertTest: permission test");
        writeCACert(InstrumentationRegistry.getContext());
        Assert.assertTrue(certContents.contains("MIIEIDCCAwigAwIBAgIQNE7VVyDV7exJ9C/ON9srbTANBgkqhkiG9w0BAQUFADCB"));


    }


}
