import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this according to your security requirements
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
  handlePatientSync(client: Socket, payload: any) {
    // Broadcast to all connected clients except sender
    client.broadcast.emit('patientDataChanged', {
      deviceId: client.handshake.query.deviceId,
      payload
    });
  }
}