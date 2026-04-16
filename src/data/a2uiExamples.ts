import { A2UIMessage } from '../types/a2ui';

export const flightBookingExample: A2UIMessage = {
  version: '1.0',
  components: [
    {
      type: 'card',
      id: 'flight-card',
      properties: {
        title: 'Book a Flight',
        description: 'Select your destination and dates'
      },
      children: [
        {
          type: 'form',
          id: 'flight-form',
          properties: {
            action: 'search_flights'
          },
          children: [
            {
              type: 'input',
              id: 'origin',
              properties: {
                label: 'From',
                placeholder: 'New York (JFK)',
                required: true
              }
            },
            {
              type: 'input',
              id: 'destination',
              properties: {
                label: 'To',
                placeholder: 'London (LHR)',
                required: true
              }
            },
            {
              type: 'input',
              id: 'date',
              properties: {
                label: 'Departure Date',
                type: 'date',
                required: true
              }
            },
            {
              type: 'button',
              id: 'search-btn',
              properties: {
                label: 'Search Flights',
                variant: 'primary'
              }
            }
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'Flight Booking',
    timestamp: new Date().toISOString()
  }
};

export const weatherExample: A2UIMessage = {
  version: '1.0',
  components: [
    {
      type: 'card',
      id: 'weather-card',
      properties: {
        title: 'Weather Forecast',
        description: 'San Francisco, CA'
      },
      children: [
        {
          type: 'list',
          id: 'weather-list',
          properties: {
            items: [
              { label: 'Today', value: '72°F - Sunny', icon: 'sun' },
              { label: 'Tomorrow', value: '68°F - Cloudy', icon: 'cloud' },
              { label: 'Wednesday', value: '65°F - Rain', icon: 'cloud-rain' }
            ]
          }
        }
      ]
    }
  ],
  metadata: {
    title: 'Weather Info',
    timestamp: new Date().toISOString()
  }
};

export const loginExample: A2UIMessage = {
  version: '1.0',
  components: [
    {
      type: 'card',
      id: 'login-card',
      properties: {
        title: 'Welcome Back',
        description: 'Please sign in to continue'
      },
      children: [
        {
          type: 'form',
          id: 'login-form',
          properties: {
            action: 'login'
          },
          children: [
            {
              type: 'input',
              id: 'email',
              properties: {
                label: 'Email',
                type: 'email',
                placeholder: 'you@example.com',
                required: true
              }
            },
            {
              type: 'input',
              id: 'password',
              properties: {
                label: 'Password',
                type: 'password',
                required: true
              }
            },
            {
              type: 'button',
              id: 'login-btn',
              properties: {
                label: 'Sign In',
                variant: 'primary',
                fullWidth: true
              }
            }
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'Login',
    timestamp: new Date().toISOString()
  }
};

export const productListExample: A2UIMessage = {
  version: '1.0',
  components: [
    {
      type: 'list',
      id: 'product-list',
      properties: {
        title: 'Recommended Products',
        grid: true
      },
      children: [
        {
          type: 'card',
          id: 'prod-1',
          properties: {
            title: 'Wireless Headphones',
            description: '$199.99',
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60'
          },
          children: [
            {
              type: 'button',
              id: 'buy-1',
              properties: {
                label: 'Add to Cart',
                variant: 'outline',
                size: 'sm'
              }
            }
          ]
        },
        {
          type: 'card',
          id: 'prod-2',
          properties: {
            title: 'Smart Watch',
            description: '$299.99',
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'
          },
          children: [
            {
              type: 'button',
              id: 'buy-2',
              properties: {
                label: 'Add to Cart',
                variant: 'outline',
                size: 'sm'
              }
            }
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'Product List',
    timestamp: new Date().toISOString()
  }
};

export const examplesMap: Record<string, A2UIMessage> = {
  'flight_booking_a2ui': flightBookingExample,
  'weather_display_a2ui': weatherExample,
  'login_form_a2ui': loginExample,
  'product_list_a2ui': productListExample
};
