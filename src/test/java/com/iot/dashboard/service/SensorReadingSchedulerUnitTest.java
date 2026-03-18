package com.iot.dashboard.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class SensorReadingSchedulerUnitTest {

    private final SensorReadingScheduler scheduler = new SensorReadingScheduler();

    @Test
    public void testGenerateRandomValueForType_Temperature() {
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "Temperature");
            assertTrue(val >= 15.0 && val <= 35.0, "Temperature out of range: " + val);
        }
    }

    @Test
    public void testGenerateRandomValueForType_Humidity() {
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "Humidity");
            assertTrue(val >= 30.0 && val <= 90.0, "Humidity out of range: " + val);
        }
    }

    @Test
    public void testGenerateRandomValueForType_Pressure() {
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "Pressure");
            assertTrue(val >= 980.0 && val <= 1020.0, "Pressure out of range: " + val);
        }
    }

    @Test
    public void testGenerateRandomValueForType_CO2() {
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "CO2");
            assertTrue(val >= 400.0 && val <= 1200.0, "CO2 out of range: " + val);
        }
    }

    @Test
    public void testGenerateRandomValueForType_Light() {
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "Light");
            assertTrue(val >= 0.0 && val <= 1000.0, "Light out of range: " + val);
        }
    }

    @Test
    public void testGenerateRandomValueForType_Motion() {
        boolean seenZero = false;
        boolean seenOne = false;
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "Motion");
            assertTrue(val == 0.0 || val == 1.0, "Motion should be 0 or 1: " + val);
            if (val == 0.0) seenZero = true;
            if (val == 1.0) seenOne = true;
        }
        assertTrue(seenZero && seenOne, "Should have seen both 0 and 1 for Motion");
    }

    @Test
    public void testGenerateRandomValueForType_Default() {
        for (int i = 0; i < 100; i++) {
            double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", "UnknownType");
            assertTrue(val >= 0.0 && val <= 100.0, "Default out of range: " + val);
        }
    }

    @Test
    public void testGenerateRandomValueForType_Null() {
        double val = (double) ReflectionTestUtils.invokeMethod(scheduler, "generateRandomValueForType", (Object) null);
        assertEquals(0.0, val);
    }
}
