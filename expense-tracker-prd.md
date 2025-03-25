
# Expense Tracker Mobile App - Product Requirements Document

## 1. Executive Summary

The Expense Tracker is a mobile application designed to automatically analyze expense patterns by reading and categorizing SMS messages from financial institutions. The app aims to provide users with comprehensive personal financial insights through automated transaction tracking and detailed reporting.

## 2. Product Objectives

- Automatically extract and categorize financial transactions from SMS
- Provide users with a comprehensive personal finance dashboard
- Enable manual entry for cash or non-SMS transactions
- Offer flexible reporting and analysis tools

## 3. User Authentication and Onboarding

### 3.1 Authentication Flow
- Login using mobile number
- SMS verification via Firebase Authentication
- One-time setup process for new users

### 3.2 User Profile Creation
Required Information:
- Profile Picture (Camera/Gallery/Avatar options)
- Full Name (Required)
- Gender (Male/Female toggle)
- Birth Date (Calendar picker)
- Email (Optional)

## 4. SMS Integration and Transaction Parsing

### 4.1 SMS Provider Selection
- User-initiated SMS provider selection
- Multi-select capability for different bank/financial message sources
- Search functionality for SMS contacts
- Date range selection (up to 6 months retrospectively)

### 4.2 Transaction Extraction Logic
Transaction Mandatory Fields:
- From Account
- To Account (for transfers)
- Transaction Type: Income/Expense/Transfer
- Category & Subcategory
- **Amount (Numerical Value)**
- **Currency (3-letter ISO Currency Code)**
- Optional: Main Person Associated

### 4.3 Message Processing Workflow
#### New Incoming Messages
- Background listening service
- Automated text parsing
- User confirmation popup for extracted transaction details
- Local storage of confirmed transactions

#### Historical Message Processing
- Batch processing of existing messages
- Sequential transaction confirmation
- Pause/resume functionality
- Progress tracking

## 5. Ad-hoc Entry Mechanism
- Manual transaction entry form
- Supports cash and non-SMS transactions
- Full feature parity with auto-extracted transactions
- **Explicit fields for amount and currency**

## 6. Reporting and Analytics

### 6.1 Default Dashboard
- Predefined analytical views
- Key financial metrics visualization
- **Multi-currency support and conversion**
- Trend analysis

### 6.2 Custom Dashboard Builder
- Drag-and-drop interface
- Customizable widgets
- Saveable dashboard configurations
- **Currency-based filtering and aggregation**

### 6.3 Reporting Features
- Downloadable Excel reports
- Detailed transaction tables
- Date range filtering
- Category-based analysis
- **Currency-wise breakdown**

## 7. Technical Specifications

### 7.1 Platform Support
- iOS and Android
- Hybrid Development Approach
  - Recommended: Ionic Framework
  - Alternative frameworks to be evaluated

### 7.2 Key Technical Components
- Firebase Authentication
- Background SMS listening service
- Local storage (SQLite/Realm)
- Data parsing and categorization engine
- **Currency conversion service integration**
- Reporting and visualization module

## 8. Predefined Categories and Subcategories

### Income
- Salary (Main Salary, Benefit, Bonus)
- Transfer from Contacts (Loan Return)
- Investment (Sukuk, Stocks)

### Expense
- Shopping (Grocery, Clothing, Appliances, Misc)
- Car (Gas, Maintenance)
- Health (Hospital, Pharmacy, Gym, Tennis, Swimming)
- Education (School, Course)
- Others (Misc)

### Transfer
- Local Bank
- International Bank

## 9. Implementation Roadmap

### Phase 1: Foundation
- User Authentication
- Basic SMS Integration
- Initial Parsing Engine
- Core UI/UX Development
- **Currency Detection and Handling**

### Phase 2: Enhanced Features
- Advanced Parsing Algorithms
- Reporting Dashboard
- Custom Dashboard Builder
- **Multi-currency Support**

### Phase 3: Optimization
- Performance Tuning
- Machine Learning Enhanced Categorization
- Expanded Integration Support
- **Advanced Currency Conversion Algorithms**

## 10. Technical Risks and Mitigations
- SMS Permission Challenges
- Data Privacy Concerns
- Performance with Large Transaction Volumes
- **Complex Multi-currency Parsing**
- **Accurate Currency Detection**

## 11. Success Metrics
- User Adoption Rate
- Transaction Accuracy
- User Engagement with Reporting Tools
- Performance Optimization
- **Currency Conversion Accuracy**

## 12. Estimated Resources
- 3-4 Developers (Full-stack, Mobile Specialists)
- 1 UX/UI Designer
- 1 QA Specialist
- 1 **Currency and Localization Specialist**
- 3-4 Months Development Timeline

## Appendix: Technical Considerations
- Encryption for Sensitive Financial Data
- Compliance with Mobile OS Privacy Guidelines
- Scalable Backend Architecture
- **Real-time Currency Exchange Rate Integration**
- **Support for Multiple Decimal Formats**
