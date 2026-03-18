package com.iot.dashboard.karate;

import com.intuit.karate.junit5.Karate;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class KarateE2E {
    @Karate.Test
    Karate testDevices() {
        System.setProperty("karate.env", "test");
        return Karate.run("devices").relativeTo(getClass());
    }
}
