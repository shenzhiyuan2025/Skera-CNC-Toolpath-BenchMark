import React from 'react';
import { A2UIComponent } from '../../../types/a2ui';
import { cn } from '../../../lib/utils';
import { Calendar, Cloud, CloudRain, Sun, Search, User, Lock, ShoppingCart } from 'lucide-react';

// Icon mapper
const IconMap: Record<string, React.FC<any>> = {
  calendar: Calendar,
  cloud: Cloud,
  'cloud-rain': CloudRain,
  sun: Sun,
  search: Search,
  user: User,
  lock: Lock,
  cart: ShoppingCart
};

export const CardComponent: React.FC<{
  component: A2UIComponent;
  renderChildren: (children?: A2UIComponent[]) => React.ReactNode;
  onAction?: (action: string, context?: Record<string, any>, values?: Record<string, any>) => void;
  value?: string;
  setValue?: (value: string) => void;
  getValues?: (ids: string[]) => Record<string, string>;
}> = ({ component, renderChildren }) => {
  const { title, description, imageUrl } = component.properties;
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
      {imageUrl && (
        <div className="h-48 w-full overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
        {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
        {renderChildren(component.children)}
      </div>
    </div>
  );
};

export const FormComponent: React.FC<{
  component: A2UIComponent;
  renderChildren: (children?: A2UIComponent[]) => React.ReactNode;
  onAction?: (action: string, context?: Record<string, any>, values?: Record<string, any>) => void;
  getValues?: (ids: string[]) => Record<string, string>;
  value?: string;
  setValue?: (value: string) => void;
}> = ({ component, renderChildren, onAction, getValues }) => {
  const { action, context, fields } = component.properties ?? {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAction || !action) return;
    const ids = Array.isArray(fields) ? (fields as string[]) : [];
    const values = getValues ? getValues(ids) : {};
    onAction(action, context, values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {renderChildren(component.children)}
    </form>
  );
};

export const InputComponent: React.FC<{
  component: A2UIComponent;
  value?: string;
  setValue?: (value: string) => void;
  onAction?: (action: string, context?: Record<string, any>, values?: Record<string, any>) => void;
  getValues?: (ids: string[]) => Record<string, string>;
}> = ({ component, value, setValue }) => {
  const { label, placeholder, type = 'text', required } = component.properties;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => setValue?.(e.target.value)}
        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

export const ButtonComponent: React.FC<{
  component: A2UIComponent;
  onAction?: (action: string, context?: Record<string, any>, values?: Record<string, any>) => void;
  value?: string;
  setValue?: (value: string) => void;
  getValues?: (ids: string[]) => Record<string, string>;
}> = ({ component, onAction }) => {
  const { label, variant = 'primary', size = 'default', fullWidth, action, context, submit } = component.properties;
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 hover:text-gray-900"
  };

  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8"
  };

  return (
    <button
      type={submit ? 'submit' : 'button'}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary,
        sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.default,
        fullWidth ? "w-full" : ""
      )}
      onClick={() => {
        if (!submit && onAction && action) {
          onAction(action, context);
        }
      }}
    >
      {label}
    </button>
  );
};

export const ListComponent: React.FC<{
  component: A2UIComponent;
  renderChildren: (children?: A2UIComponent[]) => React.ReactNode;
  onAction?: (action: string, context?: Record<string, any>, values?: Record<string, any>) => void;
  value?: string;
  setValue?: (value: string) => void;
  getValues?: (ids: string[]) => Record<string, string>;
}> = ({ component, renderChildren }) => {
  const { items, title, grid } = component.properties;

  if (component.children && component.children.length > 0) {
    return (
      <div className={cn("gap-4", grid ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col")}>
        {title && <h3 className="text-lg font-semibold mb-2 col-span-full">{title}</h3>}
        {renderChildren(component.children)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>}
      <div className="bg-white rounded-lg border border-gray-200 divide-y">
        {items?.map((item: any, idx: number) => {
          const Icon = item.icon ? IconMap[item.icon] : null;
          return (
            <div key={idx} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm text-gray-500">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
