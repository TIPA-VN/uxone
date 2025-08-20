# Contract Management Components

This directory contains React components for managing contracts within the UXOne project management system.

## Components

### 1. ContractTab (`ContractTab.tsx`)

A comprehensive contract management interface that displays and allows editing of contract details.

**Features:**
- Contract status display with color-coded badges
- Editable contract fields (type, counterparty, value, currency, status)
- Visual workflow progression
- Error handling and loading states
- Integration with contract update API

**Usage:**
```tsx
import ContractTab from '@/components/contracts/ContractTab';

<ContractTab 
  project={projectData} 
  onUpdateContract={(updates) => {
    // Handle contract updates
    console.log('Contract updated:', updates);
  }}
/>
```

**Props:**
- `project`: Project object with contract details
- `onUpdateContract`: Callback function for contract updates

### 2. ContractContextPanel (`ContractContextPanel.tsx`)

A compact contract overview panel for displaying contract summary information in project overview pages.

**Features:**
- Condensed contract information display
- Quick action buttons
- Status indicators
- Responsive design

**Usage:**
```tsx
import ContractContextPanel from '@/components/contracts/ContractContextPanel';

<ContractContextPanel 
  project={projectData}
  onViewContract={() => {
    // Navigate to full contract view
    router.push(`/projects/${project.id}?tab=contract`);
  }}
/>
```

**Props:**
- `project`: Project object with contract details
- `onViewContract`: Callback function for viewing full contract details

### 3. ContractDocumentEditor (`ContractDocumentEditor.tsx`) - **NEW in Phase 3C**

A comprehensive rich text editor component for managing contract content with advanced formatting and version control.

**Features:**
- **Rich Text Editing Interface**: Full-featured text editor with formatting toolbar
- **Document Versioning**: Automatic version creation with complete history
- **Version Restoration**: Restore previous versions when needed
- **Advanced Formatting Tools**: Bold, italic, underline, headings, lists, alignment
- **Content Elements**: Blockquotes, code blocks, links, and images
- **Character and Word Count**: Real-time content statistics
- **Save/Cancel Functionality**: Safe editing with content validation
- **Status-based Editing Permissions**: Control editing based on contract status
- **Clean Paste Handling**: Automatic cleanup of pasted content
- **Professional Styling**: Consistent formatting and visual hierarchy

**Rich Text Toolbar Features:**

**Text Formatting:**
- **Bold** - Make text bold
- **Italic** - Make text italic
- **Underline** - Underline text

**Headings:**
- **H1** - Main heading (24px, bold)
- **H2** - Sub heading (20px, bold)

**Lists:**
- **Bullet List** - Unordered list with bullets
- **Numbered List** - Ordered list with numbers

**Alignment:**
- **Left Align** - Align text to the left
- **Center Align** - Center text
- **Right Align** - Align text to the right

**Special Elements:**
- **Quote** - Create blockquote with styling
- **Code Block** - Format as preformatted code
- **Link** - Insert hyperlinks
- **Image** - Insert images from URLs

**Usage:**
```tsx
import ContractDocumentEditor from '@/components/contracts/ContractDocumentEditor';

<ContractDocumentEditor
  project={projectData}
  onSaveContent={async (content) => {
    // Save document content to storage
    return await saveDocumentContent(content);
  }}
  onShare={() => {
    // Handle sharing
  }}
/>
```

**Props:**
- `project`: Project object with contract details
- `onSaveContent`: Async function to save document content
- `onShare`: Callback for sharing document

**Content Formatting Examples:**

```html
<h1>Contract Title</h1>
<h2>Section Heading</h2>
<p><strong>Bold text</strong> and <em>italic text</em></p>
<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>
<ol>
  <li>Numbered item 1</li>
  <li>Numbered item 2</li>
</ol>
<blockquote>Important quote or note</blockquote>
<pre>Code or preformatted text</pre>
<a href="https://example.com">Link text</a>
<img src="image-url.jpg" alt="Description" />
```

### 4. ContractWorkflowActions (`ContractWorkflowActions.tsx`) - **NEW in Phase 3C**

A comprehensive workflow management component for contract approval and execution.

**Features:**
- Status-based action buttons
- Approval/rejection workflows
- Contract signing
- Execution tracking
- Comment system for actions
- Approval history tracking
- Modal-based action confirmation

**Usage:**
```tsx
import ContractWorkflowActions from '@/components/contracts/ContractWorkflowActions';

<ContractWorkflowActions
  project={projectData}
  onStatusChange={async (newStatus, comment) => {
    // Update contract status
    return await updateContractStatus(newStatus, comment);
  }}
  onRequestApproval={async () => {
    // Request approval from stakeholders
    return await requestApproval();
  }}
  onUnlockDocument={async () => {
    // Unlock document for editing
    return await unlockDocument();
  }}
/>
```

**Props:**
- `project`: Project object with contract details
- `onStatusChange`: Async function to change contract status
- `onRequestApproval`: Async function to request approval
- `onUnlockDocument`: Async function to unlock document

### 5. EnhancedContractTab (`EnhancedContractTab.tsx`) - **NEW in Phase 3C**

A comprehensive tabbed interface that combines all contract management features.

**Features:**
- Three main tabs: Details, Document Editor, Workflow
- Integrated navigation between components
- Quick action buttons
- Status-based permissions
- Unified contract management experience

**Usage:**
```tsx
import EnhancedContractTab from '@/components/contracts/EnhancedContractTab';

<EnhancedContractTab
  project={projectData}
  onUpdateContract={(updates) => {
    // Handle contract updates
    console.log('Contract updated:', updates);
  }}
/>
```

**Props:**
- `project`: Project object with contract details
- `onUpdateContract`: Callback function for contract updates

## API Integration

### Contract Update Endpoint

**PATCH** `/api/projects/[id]/contract`

Updates contract details for a specific project.

**Request Body:**
```json
{
  "contractType": "SERVICE_AGREEMENT",
  "counterparty": "Company Name",
  "value": 50000,
  "currency": "USD",
  "contractStatus": "REVIEW"
}
```

**Response:**
- Success: Updated contract details
- Error: Error message with appropriate HTTP status

### Contract Details Endpoint

**GET** `/api/projects/[id]/contract`

Retrieves contract details for a specific project.

**Response:**
- Success: Contract details object
- Error: Error message with appropriate HTTP status

## Hooks

### useContract

Custom hook for managing contract operations.

**Usage:**
```tsx
import { useContract } from '@/hooks/useContract';

const { updateContract, loading, error } = useContract();

const handleUpdate = async () => {
  const success = await updateContract(projectId, {
    contractStatus: 'APPROVED'
  });
  
  if (success) {
    // Handle success
  }
};
```

**Returns:**
- `updateContract`: Function to update contract details
- `loading`: Boolean indicating if an update is in progress
- `error`: Error message if update failed

## Contract Status Workflow

The system supports the following contract statuses:

1. **DRAFT** - Contract is in draft mode and can be edited
2. **REVIEW** - Contract is under review by stakeholders
3. **APPROVED** - Contract has been approved and is ready for execution
4. **REJECTED** - Contract has been rejected and needs revision
5. **SIGNED** - Contract has been signed by all parties
6. **EXECUTING** - Contract is currently being executed
7. **COMPLETED** - Contract has been completed successfully
8. **TERMINATED** - Contract has been terminated

## Contract Types

Supported contract types:

- `PURCHASE_CONTRACT` - Purchase agreements
- `SERVICE_AGREEMENT` - Service delivery contracts
- `LICENSE_AGREEMENT` - Software or IP licensing
- `PARTNERSHIP_AGREEMENT` - Business partnerships
- `EMPLOYMENT_CONTRACT` - Employment agreements
- `LEASE_AGREEMENT` - Property or equipment leasing

## Workflow Actions

### Available Actions by Status

**DRAFT Status:**
- Send for Review

**REVIEW Status:**
- Approve
- Reject
- Request Approval

**APPROVED Status:**
- Sign Contract
- Reopen for Editing

**SIGNED Status:**
- Start Execution

**EXECUTING Status:**
- Mark Complete

### Action Features

- **Comment System**: Add comments when performing actions
- **Approval History**: Track all approval requests and decisions
- **Status Validation**: Ensure actions are only available for appropriate statuses
- **Audit Trail**: Maintain complete history of all workflow changes

## Document Management

### Version Control

- **Automatic Versioning**: New versions created on each save
- **Version History**: Complete history of all document changes
- **Version Restoration**: Restore previous versions if needed
- **Change Tracking**: Track what changed between versions

### Content Management

- **Rich Text Editing**: Full-featured text editor
- **Content Validation**: Ensure content meets requirements
- **Auto-save**: Automatic saving of content changes
- **Export Options**: Export in various formats

## Integration Examples

### 1. Adding Enhanced Contract Tab to Project Pages

```tsx
// In your project detail page
import EnhancedContractTab from '@/components/contracts/EnhancedContractTab';

const ProjectDetailPage = ({ project }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          {project.projectType === 'CONTRACT' && (
            <button
              onClick={() => setActiveTab('contract')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contract'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contract
            </button>
          )}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && <ProjectOverview project={project} />}
      {activeTab === 'contract' && (
        <EnhancedContractTab 
          project={project}
          onUpdateContract={(updates) => {
            // Refresh project data
            refetchProject();
          }}
        />
      )}
    </div>
  );
};
```

### 2. Standalone Document Editor

```tsx
// Use document editor independently
import ContractDocumentEditor from '@/components/contracts/ContractDocumentEditor';

const DocumentPage = ({ project }) => {
  return (
    <ContractDocumentEditor
      project={project}
      onSaveContent={async (content) => {
        // Custom save logic
        return await saveToDatabase(content);
      }}
    />
  );
};
```

### 3. Workflow Management Only

```tsx
// Use workflow actions independently
import ContractWorkflowActions from '@/components/contracts/ContractWorkflowActions';

const WorkflowPage = ({ project }) => {
  return (
    <ContractWorkflowActions
      project={project}
      onStatusChange={async (status, comment) => {
        // Custom status change logic
        return await updateStatus(status, comment);
      }}
    />
  );
};
```

## Demo Pages

### Basic Demo
Visit `/contract-demo` to see the basic ContractTab component.

### Enhanced Demo
Visit `/contract-demo-enhanced` to see the complete contract management system including:
- Document editor with version control
- Workflow management with approval actions
- Integrated tabbed interface
- Complete feature demonstration

## Styling

All components use Tailwind CSS classes and follow the UXOne design system:

- **Purple theme** for contract-related elements
- **Color-coded status badges** for different contract states
- **Responsive design** for mobile and desktop
- **Consistent spacing** and typography
- **Interactive elements** with hover and focus states

## Error Handling

Components include comprehensive error handling:

- **API errors** are displayed to users
- **Loading states** prevent multiple submissions
- **Validation** ensures data integrity
- **Fallback displays** for missing data
- **User feedback** for all actions

## Performance Features

- **Lazy loading** of components
- **Optimized re-renders** with React hooks
- **Efficient state management**
- **Minimal API calls** with smart caching

## Future Enhancements

Planned features for upcoming releases:

- **Rich text editor** with formatting options
- **Document templates** for different contract types
- **Digital signature integration** for contract signing
- **Contract approval workflows** with multi-level approvals
- **Contract versioning** and change tracking
- **Integration with external contract management systems**
- **Real-time collaboration** features
- **Advanced search and filtering**
- **Contract analytics and reporting**
- **Mobile app support**
