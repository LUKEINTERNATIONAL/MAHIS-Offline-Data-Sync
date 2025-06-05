import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@Injectable() // Make it injectable
@WebSocketGateway({
  namespace: '/api/v1',
  cors: {
    origin: '*',
  }
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SyncGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const deviceId = client.handshake.query.deviceId;
    this.logger.log(`Client connected: ${deviceId}`);
  }

  handleDisconnect(client: Socket) {
    const deviceId = client.handshake.query.deviceId;
    this.logger.log(`Client disconnected: ${deviceId}`);
  }

  @SubscribeMessage('syncPatientData')
  handlePatientSync(client: Socket, payload: any): any {
    client.broadcast.emit('patientDataChanged', {
      deviceId: client.handshake.query.deviceId,
      payload
    });

    return { success: true };
  }

  // Public method that can be called from other services
  public broadcastPatientUpdate(patientId: string, updateData?: any) {
    this.logger.log(`Broadcasting patient update for ID: ${patientId}`);
    
    this.server.emit('patientDataChanged', {
      patientId,
      payload: updateData || { patientId },
      timestamp: new Date().toISOString(),
      source: 'external-service'
    });
  }

  // Method to broadcast to specific rooms/namespaces
  public broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Get connection count
  public getConnectedClientsCount(): number {
    return this.server.engine.clientsCount;
  }
}

// Example of another service using the gateway
@Injectable()
export class PatientService {
  constructor(private readonly syncGateway: SyncGateway) {}

  async updatePatient(patientId: string, updateData: any) {
    // Your business logic here
    
    // Trigger WebSocket broadcast
    this.syncGateway.broadcastPatientUpdate(patientId, updateData);
    
    return { success: true };
  }
}