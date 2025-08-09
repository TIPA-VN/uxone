import { prisma } from '@/lib/prisma';

export interface TicketNumberConfig {
  prefix: string;
  format: string;
  sequencePadding: number;
}

export class TicketNumberGenerator {
  private config: TicketNumberConfig;

  constructor(type: 'email' | 'manual' = 'manual') {
    // Default configuration - will be overridden by database values
    if (type === 'email') {
      this.config = {
        prefix: 'TIPA-HD',
        format: '{prefix}-{date}-{sequence}',
        sequencePadding: 3
      };
    } else {
      this.config = {
        prefix: 'TKT',
        format: '{prefix}-{sequence}',
        sequencePadding: 6
      };
    }
  }

  private async loadConfig(type: 'email' | 'manual'): Promise<void> {
    try {
      const configs = await prisma.systemConfig.findMany({
        where: {
          category: 'ticket_numbering',
          isActive: true
        }
      });

      if (type === 'email') {
        const emailPrefix = configs.find(c => c.key === 'email_prefix')?.value || 'TIPA-HD';
        const emailPadding = parseInt(configs.find(c => c.key === 'email_sequence_padding')?.value || '3');
        
        this.config = {
          prefix: emailPrefix,
          format: '{prefix}-{date}-{sequence}',
          sequencePadding: emailPadding
        };
      } else {
        const manualPrefix = configs.find(c => c.key === 'manual_prefix')?.value || 'TKT';
        const manualPadding = parseInt(configs.find(c => c.key === 'manual_sequence_padding')?.value || '6');
        
        this.config = {
          prefix: manualPrefix,
          format: '{prefix}-{sequence}',
          sequencePadding: manualPadding
        };
      }
    } catch (error) {
      console.error('Error loading ticket number configuration:', error);
      // Use default configuration if database fails
    }
  }

  async generateEmailTicketNumber(): Promise<string> {
    await this.loadConfig('email');
    
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: `${this.config.prefix}-${dateString}-`
        }
      },
      orderBy: {
        ticketNumber: 'desc'
      }
    });

    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[3]);
      return `${this.config.prefix}-${dateString}-${String(lastNumber + 1).padStart(this.config.sequencePadding, '0')}`;
    } else {
      return `${this.config.prefix}-${dateString}-${String(1).padStart(this.config.sequencePadding, '0')}`;
    }
  }

  async generateManualTicketNumber(): Promise<string> {
    await this.loadConfig('manual');
    
    const ticketCount = await prisma.ticket.count();
    return `${this.config.prefix}-${String(ticketCount + 1).padStart(this.config.sequencePadding, '0')}`;
  }

  // Static methods for easy access
  static async generateEmailTicket(): Promise<string> {
    const generator = new TicketNumberGenerator('email');
    return generator.generateEmailTicketNumber();
  }

  static async generateManualTicket(): Promise<string> {
    const generator = new TicketNumberGenerator('manual');
    return generator.generateManualTicketNumber();
  }
}
