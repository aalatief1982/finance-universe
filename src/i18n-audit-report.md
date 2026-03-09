# i18n Audit Report (UI labels)

- Total potentially untranslated UI string occurrences found: **724**.
- Files impacted: **118**.
- Method: regex scan for hardcoded English labels in `src/pages` and `src/components`.

## Top files by occurrences

- `src/components/transactions/TransactionFilters.tsx`: 36
- `src/components/TransactionEditForm.tsx`: 26
- `src/components/settings/DataManagementSettings.tsx`: 25
- `src/pages/EngineOutPage.tsx`: 24
- `src/components/SmsTransactionConfirmation.tsx`: 23
- `src/components/settings/CategorySettings.tsx`: 23
- `src/pages/budget/SetBudgetPage.tsx`: 22
- `src/pages/Analytics.tsx`: 18
- `src/components/wireframes/screens/ReportsScreen.tsx`: 18
- `src/pages/TrainModel.tsx`: 16
- `src/pages/budget/BudgetReportPage.tsx`: 15
- `src/pages/budget/BudgetDetailPage.tsx`: 15
- `src/pages/KeywordBankManager.tsx`: 14
- `src/pages/Profile.tsx`: 13
- `src/components/settings/SettingsPage.tsx`: 13
- `src/components/settings/LearningEngineSettings.tsx`: 13
- `src/pages/Settings.tsx`: 12
- `src/components/wireframes/ExpenseTrackerWireframes.tsx`: 12
- `src/components/settings/OTADebugSection.tsx`: 12
- `src/pages/SmsProviderSelection.tsx`: 11

## Sample findings (first 120)

```
src/pages/KeywordBankManager.tsx:107:            <CardTitle>Keyword Bank Manager</CardTitle>
src/pages/KeywordBankManager.tsx:111:              <Label>Keyword</Label>
src/pages/KeywordBankManager.tsx:115:                placeholder="e.g., netflix"
src/pages/KeywordBankManager.tsx:120:              <Label>Type</Label>
src/pages/KeywordBankManager.tsx:121:              <Input value={type} onChange={e => setType(e.target.value)} placeholder="e.g., expense" />
src/pages/KeywordBankManager.tsx:124:              <Label>Sender Context</Label>
src/pages/KeywordBankManager.tsx:125:              <Input value={senderCtx} onChange={e => setSenderCtx(e.target.value)} placeholder="Optional" />
src/pages/KeywordBankManager.tsx:128:              <Label>Transaction Type Context</Label>
src/pages/KeywordBankManager.tsx:129:              <Input value={txnCtx} onChange={e => setTxnCtx(e.target.value)} placeholder="Optional" />
src/pages/KeywordBankManager.tsx:153:                  <strong>Type:</strong> {entry.type}
src/pages/KeywordBankManager.tsx:157:                    <strong>Sender:</strong> {entry.senderContext}
src/pages/KeywordBankManager.tsx:162:                    <strong>Txn Context:</strong> {entry.transactionTypeContext}
src/pages/KeywordBankManager.tsx:167:                    <strong>Count:</strong> {entry.mappingCount}
src/pages/KeywordBankManager.tsx:172:                    <strong>Updated:</strong> {new Date(entry.lastUpdated).toLocaleDateString()}
src/components/ExpenseChart.tsx:154:                <TooltipContent>Categorized view of your spending</TooltipContent>
src/components/ExpenseChart.tsx:162:              <TabsTrigger value="category" className="data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium transition-colors">By Category</TabsTrigger>
src/components/ExpenseChart.tsx:211:                  <p className="text-center text-muted-foreground py-12">Not enough data to show a meaningful breakdown</p>
src/components/ExpenseChart.tsx:215:                <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
src/components/ExpenseChart.tsx:236:                <p className="text-center text-muted-foreground py-12">No data available yet. Try adding a few transactions first.</p>
src/pages/EditTransaction.tsx:310:        title: "Suggested transaction",
src/pages/EditTransaction.tsx:318:        title: "Low confidence match",
src/pages/EditTransaction.tsx:343:              <span className="font-semibold">Source message:</span> {rawMessage}
src/pages/EditTransaction.tsx:350:            <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Smart Matching Details</h3>
src/pages/EditTransaction.tsx:352:              <p><strong>Match Confidence:</strong> {Math.round(matchDetails.confidence * 100)}%</p>
src/pages/EditTransaction.tsx:353:              <p><strong>Matched Template:</strong> {matchDetails.entry.rawMessage.substring(0, 50)}...</p>
src/pages/EditTransaction.tsx:355:                <p className="font-semibold mb-1">Matched Fields:</p>
src/pages/EditTransaction.tsx:406:            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
src/pages/EditTransaction.tsx:413:            <AlertDialogCancel onClick={handleStayOnPage}>Stay</AlertDialogCancel>
src/pages/EditTransaction.tsx:414:            <AlertDialogAction onClick={handleDiscardChanges}>Discard</AlertDialogAction>
src/pages/VendorMapping.tsx:349:          <p className="text-center">Missing vendor data. Please reprocess SMS messages.</p>
src/pages/VendorMapping.tsx:350:          <Button onClick={() => navigate('/')}>Go Home</Button>
src/pages/VendorMapping.tsx:363:          <h1 className="text-xl sm:text-2xl font-bold">Vendor Mapping</h1>
src/pages/VendorMapping.tsx:436:                        <SelectValue placeholder="Select" />
src/pages/VendorMapping.tsx:457:                        <SelectValue placeholder="Select" />
src/pages/VendorMapping.tsx:471:                      <strong>Sample SMS:</strong> {vendor.sampleMessage}
src/components/SmsTransactionConfirmation.tsx:307:            <p className="text-sm font-medium">Category:</p>
src/components/SmsTransactionConfirmation.tsx:345:            <DialogTitle>Edit Transaction</DialogTitle>
src/components/SmsTransactionConfirmation.tsx:357:                  <SelectValue placeholder="Select type" />
src/components/SmsTransactionConfirmation.tsx:360:                  <SelectItem value="expense">Expense</SelectItem>
src/components/SmsTransactionConfirmation.tsx:361:                  <SelectItem value="income">Income</SelectItem>
src/components/SmsTransactionConfirmation.tsx:362:                  <SelectItem value="transfer">Transfer</SelectItem>
src/components/SmsTransactionConfirmation.tsx:368:              <label className="text-sm font-medium" htmlFor="sms-edit-from-account">From Account</label>
src/components/SmsTransactionConfirmation.tsx:378:                <label className="text-sm font-medium" htmlFor="sms-edit-to-account">To Account</label>
src/components/SmsTransactionConfirmation.tsx:389:                <label className="text-sm font-medium" htmlFor="sms-edit-amount">Amount</label>
src/components/SmsTransactionConfirmation.tsx:399:                <label className="text-sm font-medium" htmlFor="sms-edit-currency">Currency</label>
src/components/SmsTransactionConfirmation.tsx:410:              <label className="text-sm font-medium" htmlFor="sms-edit-category">Category</label>
src/components/SmsTransactionConfirmation.tsx:416:                  <SelectValue placeholder="Select category" />
src/components/SmsTransactionConfirmation.tsx:428:                <label className="text-sm font-medium" htmlFor="sms-edit-subcategory">Subcategory</label>
src/components/SmsTransactionConfirmation.tsx:434:                    <SelectValue placeholder="Select subcategory" />
src/components/SmsTransactionConfirmation.tsx:446:              <label className="text-sm font-medium" htmlFor="sms-edit-person">Person (Optional)</label>
src/components/SmsTransactionConfirmation.tsx:453:                    <SelectValue placeholder="Select person" />
src/components/SmsTransactionConfirmation.tsx:456:                    <SelectItem value="">None</SelectItem>
src/components/SmsTransactionConfirmation.tsx:480:              <label className="text-sm font-medium" htmlFor="sms-edit-date">Date</label>
src/components/SmsTransactionConfirmation.tsx:490:              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
src/components/SmsTransactionConfirmation.tsx:491:              <Button onClick={handleSaveEdit}>Save</Button>
src/components/SmsTransactionConfirmation.tsx:500:            <DialogTitle>Add Person</DialogTitle>
src/components/SmsTransactionConfirmation.tsx:525:            <Button variant="outline" onClick={() => setAddPersonOpen(false)}>Cancel</Button>
src/components/SmsTransactionConfirmation.tsx:526:            <Button onClick={handleSavePerson}>Save</Button>
src/pages/Profile.tsx:140:          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
src/pages/Profile.tsx:145:            <h2 className="text-lg font-semibold">Danger Zone</h2>
src/pages/Profile.tsx:160:                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
src/pages/Profile.tsx:166:                <AlertDialogCancel>Cancel</AlertDialogCancel>
src/pages/Profile.tsx:179:            <DialogTitle>Edit Profile</DialogTitle>
src/pages/Profile.tsx:185:              <Label htmlFor="fullName">Full Name<span className="text-red-500 ml-1">*</span></Label>
src/pages/Profile.tsx:192:                placeholder="Enter your full name"
src/pages/Profile.tsx:198:              <Label htmlFor="email">Email</Label>
src/pages/Profile.tsx:206:                placeholder="Enter your email address"
src/pages/Profile.tsx:212:              <Label htmlFor="phone">Mobile</Label>
src/pages/Profile.tsx:219:                placeholder="Enter your mobile number"
src/pages/Profile.tsx:226:              <Button variant="outline">Cancel</Button>
src/pages/Profile.tsx:228:            <Button onClick={handleSaveProfile}>Save Changes</Button>
src/components/SmsPermissionRequest.tsx:123:            <h3 className="font-medium">SMS Reading Not Available</h3>
src/components/SmsPermissionRequest.tsx:139:            <h3 className="font-medium">SMS Permission Granted</h3>
src/components/SmsPermissionRequest.tsx:155:        <h3 className="text-lg font-medium">SMS Permission Required</h3>
src/pages/SmsProviderSelection.tsx:60:          title: "Error loading providers",
src/pages/SmsProviderSelection.tsx:61:          description: "Failed to load SMS providers. Please try again.",
src/pages/SmsProviderSelection.tsx:91:      title: "Date selected",
src/pages/SmsProviderSelection.tsx:101:        title: "Selection required",
src/pages/SmsProviderSelection.tsx:102:        description: "Please select at least one SMS provider",
src/pages/SmsProviderSelection.tsx:116:      title: "Providers selected",
src/pages/SmsProviderSelection.tsx:132:          <h1 className="text-3xl font-bold tracking-tight mb-2">Select SMS Providers</h1>
src/pages/SmsProviderSelection.tsx:146:              <h3 className="font-medium text-green-800">Providers Detected!</h3>
src/pages/SmsProviderSelection.tsx:158:              placeholder="Search SMS providers..." 
src/pages/SmsProviderSelection.tsx:214:                <p className="text-center text-muted-foreground py-4">No providers found</p>
src/pages/SmsProviderSelection.tsx:217:                  <p className="font-medium">No providers configured yet</p>
src/components/DashboardStats.tsx:232:            <TooltipContent>Click to see transactions for this period</TooltipContent>
src/components/DashboardStats.tsx:256:            <TooltipContent>Click to see transactions for this period</TooltipContent>
src/components/DashboardStats.tsx:292:            <TooltipContent>Click to see transactions for this period</TooltipContent>
src/pages/SetDefaultCurrency.tsx:76:          placeholder="Search by code or currency"
src/components/transactions/TransactionFilters.tsx:91:            placeholder="Search transactions..."
src/components/transactions/TransactionFilters.tsx:112:                <h3 className="font-medium">Filters</h3>
src/components/transactions/TransactionFilters.tsx:161:                      <SelectValue placeholder="All Types" />
src/components/transactions/TransactionFilters.tsx:164:                      <SelectItem value="all">All Types</SelectItem>
src/components/transactions/TransactionFilters.tsx:165:                      <SelectItem value="income">Income</SelectItem>
src/components/transactions/TransactionFilters.tsx:166:                      <SelectItem value="expense">Expense</SelectItem>
src/components/transactions/TransactionFilters.tsx:179:                      placeholder="From"
src/components/transactions/TransactionFilters.tsx:185:                      placeholder="To"
src/components/transactions/TransactionFilters.tsx:216:                              placeholder="Min"
src/components/transactions/TransactionFilters.tsx:226:                              placeholder="Max"
src/components/transactions/TransactionFilters.tsx:243:                            <SelectValue placeholder="Date (newest)" />
src/components/transactions/TransactionFilters.tsx:246:                            <SelectItem value="date_desc">Date (newest)</SelectItem>
src/components/transactions/TransactionFilters.tsx:247:                            <SelectItem value="date_asc">Date (oldest)</SelectItem>
src/components/transactions/TransactionFilters.tsx:248:                            <SelectItem value="amount_desc">Amount (highest)</SelectItem>
src/components/transactions/TransactionFilters.tsx:249:                            <SelectItem value="amount_asc">Amount (lowest)</SelectItem>
src/components/transactions/TransactionFilters.tsx:250:                            <SelectItem value="title_asc">Title (A-Z)</SelectItem>
src/components/transactions/TransactionFilters.tsx:251:                            <SelectItem value="title_desc">Title (Z-A)</SelectItem>
src/components/transactions/TransactionFilters.tsx:302:                <SelectValue placeholder="Type" />
src/components/transactions/TransactionFilters.tsx:305:                <SelectItem value="all">All Types</SelectItem>
src/components/transactions/TransactionFilters.tsx:306:                <SelectItem value="income">Income</SelectItem>
src/components/transactions/TransactionFilters.tsx:307:                <SelectItem value="expense">Expense</SelectItem>
src/components/transactions/TransactionFilters.tsx:321:                    <Label className="text-xs">Start Date</Label>
src/components/transactions/TransactionFilters.tsx:325:                      placeholder="From"
src/components/transactions/TransactionFilters.tsx:329:                    <Label className="text-xs">End Date</Label>
src/components/transactions/TransactionFilters.tsx:333:                      placeholder="To"
src/components/transactions/TransactionFilters.tsx:365:            <Label className="text-sm whitespace-nowrap">Amount:</Label>
src/components/transactions/TransactionFilters.tsx:369:                placeholder="Min"
src/components/transactions/TransactionFilters.tsx:377:                placeholder="Max"
src/components/transactions/TransactionFilters.tsx:386:            <Label className="text-sm whitespace-nowrap">Sort By:</Label>
src/components/transactions/TransactionFilters.tsx:389:                <SelectValue placeholder="Date (newest)" />
src/components/transactions/TransactionFilters.tsx:392:                <SelectItem value="date_desc">Date (newest)</SelectItem>
```