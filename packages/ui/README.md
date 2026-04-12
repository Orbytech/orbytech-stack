# OrbyTech UI Component Library

A modern, reusable React component library built with TypeScript and Tailwind CSS. Provides clean, minimal, and modern UI components for OrbyTech applications.

## Features

- **Modern Design**: Clean, minimal, and modern component designs
- **TypeScript Support**: Full TypeScript support with proper type definitions
- **Tailwind CSS**: Styled with Tailwind CSS for consistent and customizable styling
- **Animations**: Smooth animations using Framer Motion
- **Accessibility**: Built with accessibility in mind
- **Responsive**: Mobile-first responsive design
- **Customizable**: Highly customizable with props and variants
- **Tree-shakable**: Optimized for bundle size

## Installation

```bash
# Install the UI library
pnpm add @orbytech/ui

# Install peer dependencies
pnpm add react react-dom tailwindcss framer-motion

# Install CSS
# Add this to your main CSS file:
@import '@orbytech/ui/styles';
```

## Setup

### 1. Configure Tailwind CSS

Make sure your `tailwind.config.js` includes the UI library's paths:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@orbytech/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 2. Import Styles

Add the UI library styles to your main CSS file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@orbytech/ui/styles';
```

## Components

### Button

A versatile button component with multiple variants and sizes.

```typescript
import { Button } from '@orbytech/ui';

function Example() {
  return (
    <div className="space-x-4">
      <Button variant="primary" size="md">
        Primary Button
      </Button>
      
      <Button variant="secondary" size="sm" leftIcon={<PlusIcon />}>
        Secondary
      </Button>
      
      <Button variant="outline" loading>
        Loading
      </Button>
      
      <Button variant="destructive" fullWidth>
        Delete
      </Button>
    </div>
  );
}
```

#### Button Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'link' \| 'destructive'` | `'default'` | Button style variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'icon'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show loading state |
| `leftIcon` | `ReactNode` | `undefined` | Icon on the left |
| `rightIcon` | `ReactNode` | `undefined` | Icon on the right |
| `fullWidth` | `boolean` | `false` | Full width button |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Border radius |
| `disabled` | `boolean` | `false` | Disabled state |
| `onClick` | `() => void` | `undefined` | Click handler |

### Input

A flexible input component with validation states and multiple variants.

```typescript
import { Input } from '@orbytech/ui';

function Example() {
  const [value, setValue] = useState('');
  
  return (
    <div className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={value && !isValidEmail(value) ? 'Invalid email' : ''}
        helperText="We'll never share your email"
        leftIcon={<MailIcon />}
      />
      
      <Input
        type="password"
        label="Password"
        showPasswordToggle
        variant="outlined"
        size="lg"
      />
      
      <Input
        type="text"
        label="Search"
        placeholder="Search..."
        variant="filled"
        rightIcon={<SearchIcon />}
      />
    </div>
  );
}
```

#### Input Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Input label |
| `type` | `string` | `'text'` | Input type |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `error` | `string` | `undefined` | Error message |
| `helperText` | `string` | `undefined` | Helper text |
| `variant` | `'default' \| 'filled' \| 'outlined' \| 'underlined'` | `'default'` | Input style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `fullWidth` | `boolean` | `false` | Full width input |
| `leftIcon` | `ReactNode` | `undefined` | Icon on the left |
| `rightIcon` | `ReactNode` | `undefined` | Icon on the right |
| `showPasswordToggle` | `boolean` | `false` | Show password toggle for password inputs |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required field |

### Card

A flexible card component with multiple variants and interactive states.

```typescript
import { Card } from '@orbytech/ui';

function Example() {
  return (
    <div className="space-y-4">
      <Card hover clickable onClick={() => console.log('clicked')}>
        <h3 className="text-lg font-semibold">Card Title</h3>
        <p className="text-gray-600">Card content goes here</p>
      </Card>
      
      <Card variant="elevated" shadow="lg" rounded="xl">
        <div className="space-y-2">
          <h4 className="font-medium">Elevated Card</h4>
          <p className="text-sm text-gray-500">With elevated shadow</p>
        </div>
      </Card>
      
      <Card variant="glass" padding="lg">
        <h3 className="text-lg font-semibold">Glass Card</h3>
        <p className="text-gray-600">With glass morphism effect</p>
      </Card>
    </div>
  );
}
```

#### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'filled' \| 'glass'` | `'default'` | Card style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Card size |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Border radius |
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'sm'` | Shadow size |
| `hover` | `boolean` | `false` | Hover effect |
| `clickable` | `boolean` | `false` | Clickable with cursor pointer |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Internal padding |
| `onClick` | `() => void` | `undefined` | Click handler |

### Modal

A flexible modal component with animations and accessibility features.

```typescript
import { Modal, Button } from '@orbytech/ui';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        size="md"
        closeOnOverlayClick
        showCloseButton
      >
        <div className="space-y-4">
          <p>Modal content goes here</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
```

#### Modal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `required` | Modal open state |
| `onClose` | `() => void` | `required` | Close handler |
| `title` | `string` | `undefined` | Modal title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `closeOnOverlayClick` | `boolean` | `true` | Close on overlay click |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `preventClose` | `boolean` | `false` | Prevent closing |
| `centered` | `boolean` | `true` | Center modal |
| `scrollable` | `boolean` | `false` | Scrollable content |

### Toast

A notification toast component with multiple types and positions.

```typescript
import { Toast } from '@orbytech/ui';

function Example() {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (type, message) => {
    const id = Date.now().toString();
    const newToast = { id, type, message };
    setToasts(prev => [...prev, newToast]);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <div>
      <div className="space-x-2">
        <Button onClick={() => addToast('success', 'Success!')}>
          Success Toast
        </Button>
        <Button onClick={() => addToast('error', 'Error!')}>
          Error Toast
        </Button>
        <Button onClick={() => addToast('warning', 'Warning!')}>
          Warning Toast
        </Button>
        <Button onClick={() => addToast('info', 'Info!')}>
          Info Toast
        </Button>
      </div>
      
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
          position="top-right"
          duration={5000}
        />
      ))}
    </div>
  );
}
```

#### Toast Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | `undefined` | Toast ID |
| `message` | `string` | `required` | Toast message |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Toast type |
| `title` | `string` | `undefined` | Toast title |
| `duration` | `number` | `5000` | Auto-dismiss duration (ms) |
| `persistent` | `boolean` | `false` | Don't auto-dismiss |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'top-center' \| 'bottom-center'` | `'top-right'` | Toast position |
| `action` | `{ label: string; onClick: () => void }` | `undefined` | Action button |
| `onClose` | `() => void` | `undefined` | Close handler |

## Utilities

The UI library also includes useful utility functions:

```typescript
import { 
  cn, 
  formatAmount, 
  formatAddress, 
  copyToClipboard,
  debounce,
  throttle 
} from '@orbytech/ui';

// Combine class names
const className = cn('base-class', 'additional-class', condition && 'conditional-class');

// Format currency amount
const formatted = formatAmount('10.123456789', 4); // "10.1235"

// Format address
const address = formatAddress('GABC...XYZ', 4, 4); // "GABC...XYZ"

// Copy to clipboard
await copyToClipboard('text to copy');

// Debounce function
const debouncedFn = debounce(() => console.log('debounced'), 300);

// Throttle function
const throttledFn = throttle(() => console.log('throttled'), 300);
```

## Customization

### Theme Customization

You can customize the component styles by overriding Tailwind CSS variables:

```css
/* your main.css */
:root {
  --orbytech-primary: #3b82f6;
  --orbytech-secondary: #6b7280;
  --orbytech-success: #10b981;
  --orbytech-warning: #f59e0b;
  --orbytech-error: #ef4444;
  --orbytech-info: #06b6d4;
}
```

### Component Variants

All components support customization through props and CSS classes:

```typescript
// Custom styling
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Button
</Button>

// Custom variant
<Input 
  className="border-2 border-purple-300 focus:border-purple-500"
  variant="default"
/>
```

## Development

### Storybook

The UI library includes Storybook for component development and testing:

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build:storybook
```

### Building

```bash
# Build the library
pnpm build:lib

# Build with CSS
pnpm build
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Examples

### Complete Form Example

```typescript
import { useState } from 'react';
import { Button, Input, Card } from '@orbytech/ui';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.message) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
    }
  };
  
  return (
    <Card variant="elevated" className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          error={errors.name}
          required
        />
        
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          error={errors.email}
          helperText="We'll never share your email"
          required
        />
        
        <Input
          label="Message"
          as="textarea"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          error={errors.message}
          required
        />
        
        <Button type="submit" fullWidth>
          Send Message
        </Button>
      </form>
    </Card>
  );
}
```

### Modal with Form Example

```typescript
import { useState } from 'react';
import { Modal, Button, Input } from '@orbytech/ui';

function UserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: ''
  });
  
  const handleSubmit = () => {
    console.log('User data:', userData);
    setIsOpen(false);
  };
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Add User
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New User"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={userData.name}
            onChange={(e) => setUserData({...userData, name: e.target.value})}
            placeholder="Enter full name"
          />
          
          <Input
            label="Email Address"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({...userData, email: e.target.value})}
            placeholder="Enter email address"
          />
          
          <Input
            label="Role"
            value={userData.role}
            onChange={(e) => setUserData({...userData, role: e.target.value})}
            placeholder="Enter user role"
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add User
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use proper accessibility attributes
- Write comprehensive tests
- Update documentation
- Use semantic commit messages

## License

MIT License - see LICENSE file for details.
