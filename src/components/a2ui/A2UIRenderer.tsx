import React, { useMemo, useState } from 'react';
import { A2UIComponent, A2UIMessage } from '../../types/a2ui';
import { CardComponent, FormComponent, InputComponent, ButtonComponent, ListComponent } from './components';

interface A2UIRendererProps {
  data: A2UIMessage | null;
  onAction?: (action: string, context?: Record<string, any>, values?: Record<string, any>) => void;
}

export const A2UIRenderer: React.FC<A2UIRendererProps> = ({ data, onAction }) => {
  const [values, setValues] = useState<Record<string, string>>({});

  const componentMap = useMemo<Record<string, React.FC<any>>>(() => {
    return {
      card: CardComponent,
      form: FormComponent,
      input: InputComponent,
      button: ButtonComponent,
      list: ListComponent,
      text: ({ component }: { component: A2UIComponent }) => <p className="text-gray-700">{component.properties.text}</p>,
      image: ({ component }: { component: A2UIComponent }) => (
        <img src={component.properties.src} alt={component.properties.alt} className="rounded-lg max-w-full" />
      ),
    };
  }, []);

  if (!data || !data.components) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <p>No UI to render</p>
      </div>
    );
  }

  const renderComponent = (component: A2UIComponent): React.ReactNode => {
    const Component = componentMap[component.type];
    
    if (!Component) {
      return (
        <div key={component.id} className="p-4 border border-red-200 bg-red-50 text-red-600 rounded mb-2">
          Unknown component type: {component.type}
        </div>
      );
    }

    return (
      <Component 
        key={component.id} 
        component={component} 
        renderChildren={(children: A2UIComponent[]) => children?.map(renderComponent)}
        onAction={onAction}
        value={values[component.id] ?? ''}
        setValue={(v: string) => setValues(prev => ({ ...prev, [component.id]: v }))}
        getValues={(ids: string[]) => ids.reduce<Record<string, string>>((acc, id) => {
          acc[id] = values[id] ?? '';
          return acc;
        }, {})}
      />
    );
  };

  return (
    <div className="a2ui-renderer w-full max-w-md mx-auto p-4 space-y-4">
      {data.metadata?.title && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{data.metadata.title}</h2>
          {data.metadata.description && (
            <p className="text-sm text-gray-500">{data.metadata.description}</p>
          )}
        </div>
      )}
      {data.components.map(renderComponent)}
    </div>
  );
};
