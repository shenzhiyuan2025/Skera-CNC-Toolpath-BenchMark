import { AgentRequest, AgentResponse } from '../types/a2ui';
import { examplesMap } from '../data/a2uiExamples';

const keywordPatterns = [
  {
    keywords: ['航班', 'flight', '机票', 'ticket', 'fly'],
    responseKey: 'flight_booking_a2ui',
    message: 'Here is a flight booking form for you.'
  },
  {
    keywords: ['天气', 'weather', '气温', 'temperature', 'forecast'],
    responseKey: 'weather_display_a2ui',
    message: 'Here is the current weather forecast.'
  },
  {
    keywords: ['登录', 'login', 'signin', 'auth'],
    responseKey: 'login_form_a2ui',
    message: 'Please log in to continue.'
  },
  {
    keywords: ['列表', 'list', '商品', 'product', 'shop', 'buy'],
    responseKey: 'product_list_a2ui',
    message: 'Here are some recommended products.'
  }
];

export const mockAgentService = {
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lowerMsg = request.message.toLowerCase();
    
    for (const pattern of keywordPatterns) {
      if (pattern.keywords.some(k => lowerMsg.includes(k))) {
        return {
          message: pattern.message,
          a2uiData: examplesMap[pattern.responseKey],
          suggestions: ['Show me something else', 'Clear']
        };
      }
    }

    return {
      message: "I'm not sure how to help with that. Try asking for 'flights', 'weather', 'login', or 'products'.",
      suggestions: ['Book a flight', 'Check weather', 'Login', 'Show products']
    };
  }
};
