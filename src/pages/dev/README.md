
# Learning Engine Documentation

## Overview

The Learning Engine is an intelligent system that improves transaction message parsing over time by learning from confirmed transactions. It's designed to recognize patterns in bank messages and automatically extract transaction details like amounts, currencies, vendors, and account information.

## Purpose

The Learning Engine serves several key purposes:

1. **Pattern Recognition**: It learns to recognize transaction patterns from various financial institutions and message formats.
2. **Automatic Data Extraction**: It extracts relevant financial data from unstructured text messages.
3. **Confidence Scoring**: It provides confidence scores for matches to help determine when extraction is reliable.
4. **Local Privacy**: All learning happens locally on the device, ensuring user financial data remains private.

## How It Works

### Core Functionality

1. **Token-based Matching**: Messages are broken down into tokens (words) that are then mapped to specific transaction fields.
2. **Field Token Mapping**: The engine maintains maps of tokens that likely represent amounts, currencies, vendors, and accounts.
3. **Confidence Calculation**: When analyzing a new message, the engine calculates a confidence score based on token matches and sender information.
4. **Learning Loop**: When users confirm transaction details, the engine learns from those confirmations to improve future parsing.

### Technical Implementation

- The system stores learned entries in local storage as serialized JSON objects
- Each entry contains the original message, confirmed transaction details, and token maps
- Configuration options allow users to adjust confidence thresholds and maximum storage

## LearningTester Component

The `LearningTester` component provides a developer interface for testing and fine-tuning the Learning Engine.

### Main Features

1. **Test Matching**: Test how well the engine matches new messages against learned patterns
2. **Confidence Breakdown**: See detailed breakdowns of why matches scored as they did
3. **JSON Data Inspection**: Examine the raw data structure of learned entries
4. **Manual Token Labeling**: Manually create token-to-field mappings to teach the engine

## Using Manual Token Labeling

The Manual Token Labeling feature allows you to explicitly teach the Learning Engine which tokens in a message correspond to which transaction fields.

### How to Use Token Labeling

1. **Enter a Message**: Paste a financial transaction message in the input field
2. **Enable Labeling Mode**: Click the "Enter Labeling Mode" button to switch to labeling mode
3. **Label Tokens**: Click on individual tokens in the message to assign them to fields:
   - **Amount**: Tokens representing monetary values
   - **Currency**: Tokens indicating the transaction currency
   - **Vendor**: Tokens identifying the merchant or vendor
   - **Account**: Tokens representing account information
   - **Unlabeled**: Tokens not relevant to any field
   - **Ignore**: Tokens to be explicitly ignored by the engine

4. **Labeling Controls**:
   - **Clear All**: Remove all labels and start over
   - **Undo**: Revert to the previous labeling state
   - **Auto-detect**: Apply automatic detection algorithms

5. **Transaction Data**: Fill in the transaction details in the "Transaction Preview" tab
6. **Save Entry**: Use the "Save as New Learned Entry" button to add this labeled entry to the engine's memory

### Best Practices for Token Labeling

- Label only the most relevant tokens for each field
- Use the "Ignore" label for tokens that might confuse the engine
- Always include accurate transaction data when saving entries
- Test your labeled entries by switching back to matching mode

## Configuration Options

The Learning Engine can be configured through the Settings page with the following options:

- **Enable/Disable**: Turn the learning engine on or off
- **Auto-Save Patterns**: Automatically save transaction patterns for learning
- **Match Confidence Threshold**: Set the minimum confidence level required for automatic matching
- **Clear Data**: Remove all learned patterns and start fresh

## Integration with Main Application

The Learning Engine integrates with the transaction processing workflow:

1. When a new message is received, the engine attempts to match it against learned patterns
2. If confidence exceeds the threshold, fields are auto-populated
3. User corrections and confirmations are fed back into the engine for continuous improvement

## Privacy Considerations

All learning data is stored locally on the device and is never synchronized to external servers. This approach maintains privacy while still improving the user experience over time.
