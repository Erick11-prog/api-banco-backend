import { Injectable } from '@nestjs/common';
import { MovimientoModel } from '../models/movimientos.model';
import { MovimientoCqrs } from '../cqrs/movimientos.cqrs';
import { ErrorMessage, SuccessfulMessage } from '../../../common/utils/movimientos.utils';
import { MovimientosDao } from '../dao/movimientos.dao';
import axios from 'axios';

@Injectable()
export class MovimientosService {

  constructor(private cqrs: MovimientoCqrs) {}

  async retiroEfectivoInterno(movimiento: MovimientoModel): Promise<object | string | any> {

    try {
      
      if(movimiento.banco == "bbvutl") {
        if(await this.cqrs.consultarDisponibleEnCajero(movimiento.cantidad))return ErrorMessage.DISPONIBLE_INSUFICIENTE;
        let cuentaClienteResponse = await this.cqrs.consultarCuentaCliente(movimiento);
        if(cuentaClienteResponse === 'e0') return ErrorMessage.CLIENTE_INEXISTENTE;
        if(cuentaClienteResponse === 'e1') return ErrorMessage.CREDENCIALES_INVALIDAS;
        if(cuentaClienteResponse === 'e2') return ErrorMessage.SALDO_INSUFICIENTE;
        if(cuentaClienteResponse === 'e3') return ErrorMessage.ACTUALIZACIÓN_INCORRECTA_EN_CUENTA;
        if(cuentaClienteResponse === 'e4') return ErrorMessage.ACTUALIZACIÓN_INCORRECTA_EN_CAJERO;        
        return {codigo_transaccion: cuentaClienteResponse, message: SuccessfulMessage.RETIRO_EXITOSO.message};

      }else{
        
        let ip = await MovimientosDao.consultarIp();
        if (await MovimientosDao.obtenerDisponibleEnCajero() < movimiento.cantidad) return ErrorMessage.DISPONIBLE_INSUFICIENTE;
        const response: any= await axios.post(ip.ip_banco, {
          nombre_banco: 'bbvutl',
          no_cuenta: movimiento.cuenta,
          nip: movimiento.nip,
          monto_retirar: movimiento.cantidad,
                  
        });

        if(response.data.error) return response.data.mensaje; 
        let cuentaClienteResponse = await this.cqrs.insertarClienteExterno(movimiento, response.data.codigo_transaccion);
        if(!cuentaClienteResponse) return ErrorMessage.RETIRO_INVALIDO.message;
        return {mensaje: SuccessfulMessage.RETIRO_EXTERNO_EXITOSO.message};

      }

    } catch (error: any) {
      console.error('Error en MovimientosService:', error);
      return `Error en MovimientosService - Función: retiroEfectivoInterno - ${error.message}`;
    }
  }

  async retiroEfectivoExterno(body: any): Promise<object | string | any> {

    try {
      let movimiento: any= {
        banco: body.nombre_banco,
        cuenta: body.no_cuenta,
        nip: body.nip,
        cantidad: body.monto_retirar,
      };
      console.log(movimiento);
      
      let cuentaClienteResponse: any= await this.cqrs.consultarCuentaCliente(movimiento)
      if(cuentaClienteResponse === 'e0') return {error: true , mensaje: ErrorMessage.CLIENTE_INEXISTENTE.message};
        if(cuentaClienteResponse === 'e1') return {error: true , mensaje: ErrorMessage.CREDENCIALES_INVALIDAS.message};
        if(cuentaClienteResponse === 'e2') return {error: true , mensaje: ErrorMessage.SALDO_INSUFICIENTE.message};
        if(cuentaClienteResponse === 'e3') return {error: true , mensaje: ErrorMessage.ACTUALIZACIÓN_INCORRECTA_EN_CUENTA};
        if(cuentaClienteResponse === 'e4') return {error: true , mensaje: ErrorMessage.ACTUALIZACIÓN_INCORRECTA_EN_CAJERO}; 
      return {error: false, codigo_transaccion: cuentaClienteResponse};

    } catch (error: any) {
      console.error('Error en MovimientosService:', error);
      return `Error en MovimientosService - Función: retiroEfectivoExterno - ${error.message}`;
    }
  }

}
