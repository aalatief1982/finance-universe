
# Expense Tracker Mobile App - App Flows Document

## 1. Authentication Flow

### 1.1 Initial App Launch
```mermaid
graph TD
    A[App Launch] --> B{First-time User?}
    B -->|Yes| C[Show Welcome Screen]
    B -->|No| D[Login Screen]
    C --> D
    D --> E[Enter Mobile Number]
    E --> F[Send SMS Verification Code]
    F --> G[User Enters Verification Code]
    G --> H{Code Verified?}
    H -->|Yes| I[User Dashboard]
    H -->|No| E
```

### 1.2 User Profile Creation Flow
```mermaid
graph TD
    A[Profile Creation] --> B[Upload Profile Picture]
    B --> C[Enter Full Name]
    C --> D[Select Gender]
    D --> E[Pick Birth Date]
    E --> F[Optional: Enter Email]
    F --> G[Save Profile]
    G --> H[SMS Provider Selection Screen]
```

## 2. SMS Integration Flow

### 2.1 SMS Provider Selection
```mermaid
graph TD
    A[SMS Provider Selection] --> B[Request SMS Access Permission]
    B --> C[Load SMS Contacts]
    C --> D[Search SMS Contacts]
    D --> E[Multi-Select Financial Contacts]
    E --> F[Select Start Date for Tracking]
    F --> G[Confirm Providers]
```

### 2.2 Transaction Extraction - New Messages
```mermaid
graph TD
    A[Background SMS Listener] --> B{Message from Known Sender?}
    B -->|Yes| C[Parse Message Content]
    C --> D[Extract Transaction Details]
    D --> E[Auto-Categorize Transaction]
    E --> F[Show Confirmation Popup]
    F --> G{User Confirms?}
    G -->|Yes| H[Save to Local Storage]
    G -->|No| I[Allow Manual Editing]
    I --> H
```

### 2.3 Historical Message Processing
```mermaid
graph TD
    A[Historical Message Processing] --> B[Load Selected Providers]
    B --> C[Start Batch Processing]
    C --> D[Extract First Message]
    D --> E[Parse Transaction Details]
    E --> F[Show Confirmation Popup]
    F --> G{User Confirms?}
    G -->|Yes| H[Save Transaction]
    G -->|No| I[Allow Manual Editing]
    I --> H
    H --> J{More Messages?}
    J -->|Yes| D
    J -->|No| K[Processing Complete]
```

## 3. Ad-hoc Entry Flow
```mermaid
graph TD
    A[Manual Entry] --> B[Select Entry Type]
    B --> C[Choose Transaction Category]
    C --> D[Select Subcategory]
    D --> E[Enter Amount]
    E --> F[Select Currency]
    F --> G[Optional: Select Main Person]
    G --> H[Optional: Add Description]
    H --> I[Save Transaction]
    I --> J[Return to Dashboard]
```

## 4. Reporting and Dashboard Flow

### 4.1 Default Dashboard
```mermaid
graph TD
    A[Dashboard Landing] --> B[Overview Metrics]
    B --> C[Income vs Expense Chart]
    C --> D[Category Breakdown]
    D --> E[Recent Transactions]
    E --> F[Quick Filters]
    F --> G[Drill Down Options]
```

### 4.2 Custom Dashboard Builder
```mermaid
graph TD
    A[Custom Dashboard] --> B[Add New Widget]
    B --> C[Select Widget Type]
    C --> D[Configure Widget Parameters]
    D --> E[Position Widget]
    E --> F[Save Dashboard Configuration]
    F --> G[Apply to View]
```

## 5. Error Handling Flows

### 5.1 SMS Permission Denied
```mermaid
graph TD
    A[SMS Access Denied] --> B[Show Permission Explanation]
    B --> C[Guide to Settings]
    C --> D[Retry Permission]
    D --> E{Permission Granted?}
    E -->|Yes| F[Continue Setup]
    E -->|No| G[Limited Functionality Mode]
```

### 5.2 Transaction Parsing Failure
```mermaid
graph TD
    A[Parsing Failed] --> B[Show Error Popup]
    B --> C[Offer Manual Entry]
    C --> D[Suggest Categorization]
    D --> E[User Confirms/Edits]
    E --> F[Save Corrected Transaction]
```

## 6. Settings and Profile Management
```mermaid
graph TD
    A[Settings] --> B[Profile Edit]
    B --> C[Change Profile Picture]
    C --> D[Update Personal Details]
    D --> E[Currency Preferences]
    E --> F[Notification Settings]
    F --> G[Data Backup/Restore]
```

## Appendix: Key User Journeys
1. New User Onboarding
2. Existing User Login
3. SMS Transaction Tracking
4. Manual Transaction Entry
5. Reporting and Analytics
6. Profile and Settings Management

## Recommendations for Implementation
- Implement robust error handling
- Ensure smooth user experience during SMS parsing
- Provide clear guidance and tooltips
- Design intuitive navigation between flows
