package com.iot.dashboard;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class DashboardE2ETest {

    @LocalServerPort
    private int port;

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeAll
    static void setupClass() {
        WebDriverManager.chromedriver().setup();
    }

    @BeforeEach
    void setup() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Test Login Functionality")
    void testLogin() {
        driver.get("http://localhost:" + port + "/index.html");

        WebElement usernameField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("username")));
        WebElement passwordField = driver.findElement(By.id("password"));
        WebElement loginButton = driver.findElement(By.cssSelector(".signin-btn"));

        // Using credentials from data.sql (assuming standard ones if not sure, but usually admin@mail.com / password)
        usernameField.sendKeys("admin@mail.com");
        passwordField.sendKeys("password123");
        loginButton.click();

        // Check if dashboard view becomes active
        wait.until(ExpectedConditions.attributeContains(By.id("dashboardView"), "class", "active"));
        
        WebElement userDisplay = driver.findElement(By.id("userDisplay"));
        assertTrue(userDisplay.isDisplayed());
    }

    @Test
    @DisplayName("Test Navigation to Sensors View")
    void testNavigation() {
        testLogin();

        WebElement sensorsLink = wait.until(ExpectedConditions.elementToBeClickable(By.id("sensorsLink")));
        sensorsLink.click();

        WebElement sensorsContent = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("sensorsContent")));
        assertTrue(sensorsContent.isDisplayed());
    }
}
