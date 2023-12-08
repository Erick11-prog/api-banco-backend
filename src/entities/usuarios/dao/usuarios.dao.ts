import { DatabaseService } from '../../../database/services/database.service';

export class UsuariosDao {
    constructor() {}

  static async insertarUsuario(usuario: any)
  {
    let {correo, contrasenia} = usuario;
    let sql: string;

    try {
      sql = "INSERT INTO don_galleto.usuarios (correo, contrasenia) VALUES(?,?);";

      const values = [correo, contrasenia];

      let respuesta:any = await DatabaseService.executeQuery(sql, values);

      return respuesta.insertId;
    } catch (error) {
      console.log("Error en inserción DAO: ", error);
      throw error;      
    }

  }

  static async obtenerUsuarios(usuario: any): Promise<any> {
    let correo = usuario.correo;
    let sql: string;
    
    try {

        sql = `
        SELECT u.id_usuario, u.contrasenia, r.id_rol, r.rol 
        FROM don_galleto.usuarios AS u
        INNER JOIN don_galleto.roles AS r ON r.id_rol = u.id_rol
        WHERE u.correo = ?;
        `;

        const values = [correo];

        const result = await DatabaseService.executeQuery(sql, values);
        
        return result[0];
        
    } catch (error) {
        console.error('Error en MovimientosDao:', error);
        throw error;
    }

  }
}