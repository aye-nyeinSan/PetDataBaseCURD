const express = require("express");
const mysqlConnection = require("../utils/database.js");
const Router = express.Router();
Router.use(express.json());
const bodyParser = require ("body-parser");
Router.use(bodyParser.json());
Router.use(bodyParser.urlencoded({ extended: true }));
const methodOverride=require('method-override');
Router.use(methodOverride('_method'));

// DELETE route to delete a specific booking by ID
Router.get('/appointments/delete/:id', async (req, res) => {
    const bookingId = req.params.id;
    console.log("Booking ID to delete:", bookingId);
    try {
        
        const deleteBookingSQL = `
            DELETE appointment, customer, pet
            FROM appointment
            LEFT JOIN customer ON appointment.customerID = customer.customerID
            LEFT JOIN pet ON appointment.petID = pet.petID
            WHERE appointment.bookingID = ?`;
          await mysqlConnection.promise().query(deleteBookingSQL, [bookingId]);

    
           res.redirect('/appointments/')
        
        
    } catch (err) {
        console.error(err);
        res.json({ message: 'Error deleting booking' });
    }
});

Router.get("/customers",(req,res)=>{
    mysqlConnection.query(
         "SELECT * FROM customer",
         (err,results,fields)=>{
            if(!err){
                res.send(results);
            } else{
                res.status(404);
                console.log(err);
            }

         }
    )
    
});

Router.get("/customers/:id",(req,res)=>{
    const param_id = req.params.id;
    mysqlConnection.query( `SELECT * FROM customer where customerID =${param_id}`, (err,results,fields)=>{
        if(!err){
            res.send(results);
            
        } else{
            console.log(err);
        }

     })
});
Router.get("/",(req,res)=>{
    res.redirect('/appointments/');
  });
  


//home page
Router.get("/appointments/",(req,res)=>{
    
    const sql=`SELECT
                appointment.bookingID,
                customer.customerName,
                pet.petName,
                spa_service.spaserviceName,
                appointment.bookingDate
            FROM
                appointment
            INNER JOIN
                customer ON appointment.customerID = customer.customerID
            INNER JOIN
                pet ON appointment.petID = pet.petID
            INNER JOIN
                spa_service ON appointment.serviceID = spa_service.serviceID;`;
    
    mysqlConnection.query(
        sql,
        (err,results,fields)=>{
           if(!err){
           // res.send(results);
            res.render('index',{title:'Appointment',appointments: results});
              
           } else{
            res.status(404).json({ message: "Table appointment is not found." });
               console.log(err);
           }

        }
   )



});



//aboutPage
Router.get("/about",(req,res)=>{
    res.render('about',{ title:'About'});

});

//create appointment
Router.get('/appointments/create/',(req,res)=>{
    res.render('create',{title: 'Create Appointment ☑'});
});

Router.post("/appointments/create/", async (req, res) => {
   
    const { customerName, phoneNumber, email,
         petName, age, species, medicalCondition, 
         weight, spaServiceName } = req.body;
        // console.log("Spa Service name:",spaServiceName);


    const bookingDate = new Date().toISOString().split('T')[0];

    try {
       
        const [customerResult] = await mysqlConnection.promise().
        query("INSERT INTO customer (IssuedDate, phoneNumber, email, customerName) VALUES (?, ?, ?, ?)",
         [bookingDate, phoneNumber, email, customerName]);

       
         const customerID = customerResult.insertId;
        const [petResult] = await mysqlConnection.promise().
        query("INSERT INTO pet (petName, age, species, medicalCondition, weight, customerID) VALUES (?, ?, ?, ?, ?, ?)"
        , [petName, age, species, medicalCondition, weight, customerID]);

        const petID = petResult.insertId;
      const [serviceRow] = await mysqlConnection.promise().
        query("SELECT serviceID FROM spa_service WHERE LOWER(spaserviceName) = LOWER(?)",
         [spaServiceName]);

        if (serviceRow.length === 0) {
        
            res.json({ message: "Selected service not found" });
            return;
        }
 
        const serviceID = serviceRow[0].serviceID;
        const update_mysql1= `
        UPDATE customer
        SET  petID =${petID} 
        WHERE customerID=${customerID};
        `;
        const update_mysql2= `
        UPDATE pet
        SET  serviceID =${serviceID} 
        WHERE petID =${petID};
        `;
        await mysqlConnection.promise().query(update_mysql1,[petID]);
        await mysqlConnection.promise().query(update_mysql2,[serviceID]);
       const insertAppointmentSQL = "INSERT INTO appointment (customerID, petID, serviceID, bookingDate) VALUES (?, ?, ?, ?)";
         const appointmentValues = [customerID, petID, serviceID, bookingDate];

    
        const [appointmentResult] = await mysqlConnection.promise().
        query(insertAppointmentSQL, appointmentValues);
        console.log("Appointment created:", appointmentResult.insertId);
        res.redirect('/appointments/');
    } catch (err) {
        console.error(err);
        res.json({ message: "Error creating appointment" });
    }
});



Router.get("/appointments/:id/update",(req,res)=>{
    const param_id = req.params.id;
    console.log(param_id);
    const sql=`SELECT
                bookingID,
                customer.customerName,
                pet.petName,
                spa_service.spaserviceName
            FROM
                appointment 
            INNER JOIN
                customer ON appointment.customerID = customer.customerID
            INNER JOIN
                pet ON appointment.petID = pet.petID
            INNER JOIN
                spa_service ON appointment.serviceID = spa_service.serviceID
                where bookingID= ${param_id};`;
    mysqlConnection.query(
        sql,
        (err,results,fields)=>{
            console.log(results);
           if(!err){
            res.render('update',{title:'Update👾',appointment:results});
           } else{
              res.status(404).json({ message: "appointmentID is not found." });
               console.log(err);
           }

        }
   )

});


//PUT update
Router.put(`/appointments/:id`, async (req, res) => {
    const bookingId = req.params.id;
    //console.log("bookingId:", bookingId);
    const { customerName, petName, spaserviceName } = req.body;
   // console.log("Change name:", customerName);
   // console.log("Change petname:", petName);
   // console.log("Change spaservicename:", spaserviceName);
    try {

        const updateCustomerNameSQL = `
            UPDATE customer AS c
            JOIN appointment AS a ON c.customerID = a.customerID
            SET c.customerName = ?
            WHERE a.bookingID = ?`; 

        const updatePetNameSQL = `
            UPDATE pet AS p
            JOIN appointment AS a ON p.petID = a.petID
            SET p.petName = ?
            WHERE a.bookingID = ?`;

        const updateServiceNameSQL = `
            UPDATE spa_service AS s
            JOIN appointment AS a ON s.serviceID = a.serviceID
            SET s.spaserviceName = ?
            WHERE a.bookingID = ?`;

        const [updateCustomerResult] = await mysqlConnection.promise().query(updateCustomerNameSQL, [customerName, bookingId]);
        const [updatePetResult] = await mysqlConnection.promise().query(updatePetNameSQL, [petName, bookingId]);
        const [updateServiceResult] = await mysqlConnection.promise().query(updateServiceNameSQL, [spaserviceName, bookingId]);

        if (updateCustomerResult.affectedRows === 1 && updatePetResult.affectedRows === 1 
            && updateServiceResult.affectedRows === 1) {
            res.redirect(`/appointments/`);
        } else {
            res.json({ message: 'Customer not found' });
        }
    } catch (err) {
        console.error(err);
        res.json({ message: 'Error updating customer name' });
    }
});





module.exports= Router;
