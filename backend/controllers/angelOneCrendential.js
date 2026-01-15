
import AngelOneCredentialer from '../models/angelOneCredential.js';



export const getAngelOneCredential = async (req, res) => {
    try {

    const  userId  = req.userId

     if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "userId is required in params.",
        data: null,
      });
    }

    const credential = await AngelOneCredentialer.findOne({ where: { userId: userId } });

    if (!credential) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "AngelOne credentials retrieved successfully.",
      data: credential,
    });
   
    } catch (error) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};


export const createAngelOneCredential = async (req, res) => {
    try {

        const {  clientId, totpSecret, password } = req.body;

        // Validation
            if ( !clientId || !totpSecret || !password) {
            return res.json({
                status: false,
                statusCode: 400,
                message: "All fields (clientId, totpSecret, password) are required.",
                data: null,
            });
            }
   
        let existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });

        if (existing) {
      
       existing.clientId = clientId;
      existing.totpSecret = totpSecret;
      existing.password = password; // ⚠️ consider hashing
      await existing.save();

      return res.json({
        status: true,
        statusCode: 200,
        message: "AngelOne credentials updated successfully.",
        data: existing,
      });
      }

            // Create new record
            const created = await AngelOneCredentialer.create({
            userId: req.userId,
            clientId: clientId,
            totpSecret: totpSecret,
            password: password, // ⚠️ consider hashing before saving
            });

            return res.json({
            status: true,
            statusCode: 201,
            message: "AngelOne credentials saved successfully.",
            data: created,
            });

    } catch (error) {

         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};