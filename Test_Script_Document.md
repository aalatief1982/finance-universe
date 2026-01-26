# Test Script Document

## App Name: Xpensia Finance Universe

---

## Table of Contents
1. General Settings
   - Save Settings
   - Change Theme
   - Change Currency
   - Change Week Start Day
2. Notifications
   - Enable/Disable Notifications
3. SMS Settings
   - Enable/Disable Background SMS
   - Enable/Disable SMS Auto-Import
4. Data Management
   - Export Data
   - Import Data
   - Clear Sample Data
5. Beta Features
   - Activate Beta Features
6. OTA Updates
   - Check for Updates
   - Download and Apply Updates
7. Error Handling
   - Unsaved Changes Prompt
   - Failed Export/Import Handling

---

## 1. General Settings

### 1.1 Save Settings
- **Scenario**: Save user preferences for theme, currency, SMS, and display options.
- **Steps**:
  1. Open the app and navigate to the **Settings** page.
  2. Modify any of the following settings:
     - Theme
     - Currency
     - Week Start Day
     - SMS Auto-Import
  3. Click the **Save Settings** button.
- **Expected Output**: A toast message appears: "Settings saved successfully." The changes are persisted, and the app reflects the updated settings.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Save Settings Screenshot](#)

---

### 1.2 Change Theme
- **Scenario**: Change the app's theme to Light, Dark, or System.
- **Steps**:
  1. Open the **Settings** page.
  2. Under the **Appearance** section, select a theme (Light, Dark, or System).
  3. Observe the app's appearance.
- **Expected Output**: The app's theme changes to the selected option.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Change Theme Screenshot](#)

---

### 1.3 Change Currency
- **Scenario**: Change the default currency for transactions.
- **Steps**:
  1. Open the **Settings** page.
  2. Under the **Appearance** section, select a currency from the dropdown menu.
  3. Save the settings.
- **Expected Output**: The selected currency is saved and displayed in relevant parts of the app.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Change Currency Screenshot](#)

---

### 1.4 Change Week Start Day
- **Scenario**: Change the day the week starts on.
- **Steps**:
  1. Open the **Settings** page.
  2. Under the **Display Options** section, select a new day (Sunday, Monday, or Saturday).
  3. Save the settings.
- **Expected Output**: The selected day is saved and reflected in the app's calendar views.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Change Week Start Day Screenshot](#)

---

## 2. Notifications

### 2.1 Enable/Disable Notifications
- **Scenario**: Enable or disable notifications for the app.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Notification Settings** section.
  3. Toggle the **Enable Notifications** switch.
  4. Grant or deny notification permissions if prompted.
- **Expected Output**: Notifications are enabled or disabled based on the toggle. A toast message appears confirming the change.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Enable/Disable Notifications Screenshot](#)

---

## 3. SMS Settings

### 3.1 Enable/Disable Background SMS
- **Scenario**: Enable or disable background SMS reading.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **SMS Settings** section.
  3. Toggle the **Enable SMS Auto-Import** switch.
  4. Grant or deny SMS permissions if prompted.
- **Expected Output**: Background SMS reading is enabled or disabled based on the toggle. A toast message appears confirming the change.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Enable/Disable Background SMS Screenshot](#)

---

## 4. Data Management

### 4.1 Export Data
- **Scenario**: Export transaction data to a file.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Data Management** section.
  3. Click the **Export Data** button.
- **Expected Output**: A file containing transaction data is downloaded or saved to the device. A toast message appears: "Export successful."
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Export Data Screenshot](#)

---

### 4.2 Import Data
- **Scenario**: Import transaction data from a file.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Data Management** section.
  3. Click the **Import Data** button.
  4. Select a valid JSON or CSV file.
- **Expected Output**: The transactions from the file are added to the app. A toast message appears: "Import successful."
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Import Data Screenshot](#)

---

### 4.3 Clear Sample Data
- **Scenario**: Clear all demo transactions from the app.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Data Management** section.
  3. Click the **Clear Sample Data** button.
  4. Confirm the action in the prompt.
- **Expected Output**: All demo transactions are removed. A toast message appears: "Sample data cleared."
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Clear Sample Data Screenshot](#)

---

## 5. Beta Features

### 5.1 Activate Beta Features
- **Scenario**: Activate beta features using a beta code.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Beta Features** section.
  3. Click the **Activate Beta Features** button.
  4. Enter a valid beta code and click **Activate Features**.
- **Expected Output**: Beta features are activated. A toast message appears: "Beta features activated."
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Activate Beta Features Screenshot](#)

---

## 6. OTA Updates

### 6.1 Check for Updates
- **Scenario**: Check for available OTA updates.
- **Steps**:
  1. Open the **Settings** page.
  2. Scroll to the **OTA Debug Section**.
  3. Click the **Check for Updates** button.
- **Expected Output**: The app checks for updates and displays the current and available versions.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Check for Updates Screenshot](#)

---

### 6.2 Download and Apply Updates
- **Scenario**: Download and apply an available OTA update.
- **Steps**:
  1. Perform the steps in **6.1** to check for updates.
  2. If an update is available, click the **Download Update** button.
  3. Wait for the download to complete.
  4. Observe the app applying the update.
- **Expected Output**: The update is downloaded and applied successfully. The app restarts with the new version.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Download and Apply Updates Screenshot](#)

---

## 7. Error Handling

### 7.1 Unsaved Changes Prompt
- **Scenario**: Prompt the user when they try to leave the settings page with unsaved changes.
- **Steps**:
  1. Open the **Settings** page.
  2. Make changes to any setting without saving.
  3. Attempt to navigate away from the page.
- **Expected Output**: A prompt appears asking the user to save or discard changes.
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Unsaved Changes Prompt Screenshot](#)

---

### 7.2 Failed Export Handling
- **Scenario**: Handle errors during data export.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Data Management** section.
  3. Click the **Export Data** button when there are no transactions to export.
- **Expected Output**: A toast message appears: "No data to export."
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Failed Export Handling Screenshot](#)

---

### 7.3 Failed Import Handling
- **Scenario**: Handle errors during data import.
- **Steps**:
  1. Open the **Settings** page.
  2. Navigate to the **Data Management** section.
  3. Click the **Import Data** button.
  4. Select an invalid file (e.g., a non-JSON or non-CSV file).
- **Expected Output**: A toast message appears: "Failed to parse the imported file. Make sure it's a valid JSON or CSV file."
- **Actual Output**: (Leave blank for user entry)
- **Screenshot**: ![Failed Import Handling Screenshot](#)

---

### Categorization

1. **General Settings**: Theme, currency, week start day, and save settings.
2. **Notifications**: Enable/disable notifications.
3. **SMS Settings**: Background SMS and auto-import.
4. **Data Management**: Export, import, and clear sample data.
5. **Beta Features**: Activate beta features.
6. **OTA Updates**: Check for updates, download, and apply updates.
7. **Error Handling**: Unsaved changes, failed export, and failed import.

---

### Next Steps
1. **Add Screenshots**: Capture screenshots for each step in the app and insert them into the document.
2. **Test Each Flow**: Follow the steps and fill in the **Actual Output** column.
3. **Report Issues**: Note any discrepancies between the expected and actual outputs.

Let me know if you'd like me to assist further!
