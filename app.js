const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require("express-session");
const app = express();
app.use(session({ secret: "5DED5486FFDE459BC62C69A879C93", resave: true, saveUninitialized: true }));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect('mongodb://127.0.0.1:27017/vhr', { useNewUrlParser: true, useUnifiedTopology: true });

const path = require('path');
const { log } = require("console");
const filePath = path.join(__dirname, 'public', 'files', 'loginActivities', 'signUp.html');

// Server Side Scripting code
app.get('/' , (req , res)=>{
    res.sendFile(__dirname + '/home.html')
})
app.get('/signUp.html', (req, res) => {
    res.sendFile(__dirname + '/signUp.html'); // Use the filePath variable
});
app.get('/registration', (req, res) => {
    res.sendFile(__dirname + '/registration.html'); // Use the filePath variable
});
//Registration Model
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
});
const User = mongoose.model("User", userSchema);
// Registration route
// Registration route
app.post('/signUp', (req, res) => {
    // Create a new user object with the user's registration data
    const newUser = new User(req.body);

    // Save the new user to the database
    newUser.save()
        .then(savedUser => {
            req.session.userId = savedUser._id;
            console.log('User ID:', savedUser._id); // Corrected this line
            // Redirect to the patient registration form and pass userId as a query parameter
            res.redirect('/registration?userId=' + savedUser._id);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Error creating account" });
        });
});
const patientSchema = new mongoose.Schema({
    Fname: String,
    Lname: String,
    dateOfBirth: Date,
    ph: Number,
    age: Number,
    address: String,
    gender: String,
    bloodGroup: String,
    country: String,
    state: String,
    height: Number,
    weight: Number,
    bp: Number,
    heartRate: Number,
    prevMedical: [
        {
            condition: String,
            treatment: String
        }
    ],
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
    medicalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalHistory' }],
    medication: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medication' }],
});

const Patient = mongoose.model("Patient", patientSchema);
// Registration Part where i save the users data and make an new Patient 
app.post('/registration', async (req, res) => {
    console.log('User ID:', req.session.userId);
    try {
        // Check if the user is authenticated
        if (!req.session.userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // Find the user in the database by their ID
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Create a new patient instance and include user information
        const newPatient = new Patient({
            // User data
            userId: req.session.userId,
            // Other patient data based on your form
            Fname: req.body.firstName,
            Lname: req.body.lastName,
            dateOfBirth: req.body.dob,
            ph: req.body.contactNumber,
            age: req.body.age,
            address: req.body.address,
            gender: req.body.gender,
            bloodGroup: req.body.bloodGroup,
            country: req.body.country,
            state: req.body.state,
            height: req.body.height,
            weight: req.body.weight,
            bp: req.body.bloodPressure,
            heartRate: req.body.heartRate,
            // Assuming prevMedical is an array of objects (condition and treatment)
            prevMedical: [
                {
                    condition: req.body.medicalCondition,
                    treatment: req.body.treatment
                }
            ],
        });

        // Save the new patient record
        const savedDocument = await newPatient.save();
        res.status(201).json(savedDocument);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error during patient registration" });
    }
});


// Route for listing all patients
app.route("/patients")
    .get(function (req, res) {
        Patient.find({})
        .populate('_id')
        .exec()
            .then(foundPatients => {
                res.status(200).json(foundPatients);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "An error occurred while fetching patients" });
            });
    })
    // Route for adding a new patient
    .post((req, res) => {
        const newPatient = new Patient(req.body);
        newPatient
            .save()
            .then(savedDocument => {
                res.status(201).json(savedDocument);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error saving patient" });
            });
    })
    // Route to delete all patients
    .delete((req, res) => {
        Patient.deleteMany()
            .then(result => {
                res.status(204).send();
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error deleting patients" });
            });
    });

// Route for specific patient data
app.route("/patients/:userId")
    .put(function (req, res) {
        const updatedData = req.body;
        Patient.findOneAndUpdate(
            { _id: req.params.userId },
            { $set: updatedData },
            { new: true }
        )
            .then((result) => {
                if (result) {
                    res.status(200).json(result);
                } else {
                    res.status(404).json({ message: "Patient not found" });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ error: "Internal server error" });
            });
    })
    .patch(function (req, res) {
        const userId = req.params.userId;
        const updatedData = req.body;

        Patient.updateOne(
            { _id: userId },
            { $set: updatedData }
        )
            .then((result) => {
                if (result.nModified === 0) {
                    res.status(404).json({ message: "Patient not found" });
                } else {
                    res.status(200).json({ message: "Patient updated" });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ error: "Internal server error" });
            });
    });

// Doctor Schema
const doctorSchema = new mongoose.Schema({
    d_id: Number,
    name: String,
    ph: Number,
    licenseNumber: Number,
    clinicAddress: String,
    gender: String,
    specality: String,
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
});

const Doctor = mongoose.model("Doctor", doctorSchema);

// Route for listing all doctors
app.route("/doctors")
    .get(function (req, res) {
        Doctor.find({})
            .populate('patients') // Populate the patients field
            .then(foundDoctors => {
                res.status(200).json(foundDoctors);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "An error occurred while fetching doctors" });
            });
    })
    // Route for adding a new doctor
    .post((req, res) => {
        const newDoctor = new Doctor(req.body);
        newDoctor
            .save()
            .then(savedDoctor => {
                res.status(201).json(savedDoctor);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error saving doctor" });
            });
    })
    // Route to delete all doctors
    .delete((req, res) => {
        Doctor.deleteMany()
            .then(result => {
                res.status(204).send();
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error deleting doctors" });
            });
    });



////------------->Appointments Schema <------------

const apponitmentSchema = new mongoose.Schema({
    p_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    d_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    // venue : String,
    date : Date,
    diagnose_condition : String,
    apponitmentStatus : String,
    a_id : String
});

const Appointment = mongoose.model("Appointment", apponitmentSchema);
app.route("/appointment")
    .get(function (req, res) {
        Appointment.find({})
            .populate('p_id') // Populate the 'p_id' field, assuming it references the 'Patient' model
            .populate('d_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
            .exec() // Execute the query
            .then(foundAppointment => {
                res.status(200).json(foundAppointment);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "An error occurred" });
            });
    })
    .post( (req , res)=>{
        const newDoctor = new Appointment(req.body);
        newDoctor.save()
        .then(savedDoctor=>{
            res.status(200).json(savedDoctor);
        })
        .catch(err =>{
            console.log(err);
            res.status(500).json({error : "An error occured"});
        })
    });

//Getting an specific Apppointemnt
app.route("/appointments/:appointmentId")
    .get(function (req, res) {
        const appointmentId = req.params.appointmentId;

        Appointment.findById(appointmentId)
            .populate({
                path: 'p_id',
                select: 'name' // Select only the 'name' field
            })
            .populate({
                path: 'd_id',
                select: 'name' // Select only the 'name' field
            })
            .exec()
            .then(foundAppointment => {
                if (!foundAppointment) {
                    return res.status(404).json({ message: "Appointment not found" });
                }

                res.status(200).json(foundAppointment);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "An error occurred" });
            });
    });


//------------->Medical History <-------------

const medicalHistorySchema = new mongoose.Schema({
    condition_id : Number, 
    p_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    d_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    conditon : String ,
    stage : String,
    a_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
});
const MedicalHistory = mongoose.model("MedicalHistory" , medicalHistorySchema);


//Route for All listing of medical HIstory

app.route("/medicalHstory")
    .get( (req , res)=>{
        MedicalHistory.find({})
        .populate('p_id') // Populate the 'p_id' field, assuming it references the 'Patient' model
        .populate('d_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
        .populate('a_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
        .exec() // Execute the query
        .then(foundmedicalHistory => {
            res.status(200).json(foundmedicalHistory);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "An error occurred" });
        });
    })
    .post((req, res) => {
        const newMedicalHistory = new MedicalHistory(req.body);
        newMedicalHistory
            .save()
            .then(savedMedicalHistory => {
                res.status(201).json(savedMedicalHistory);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error saving Medical History" });
            });
    })
    .delete((req, res) => {
        MedicalHistory.deleteMany()
            .then(result => {
                res.status(204).send();
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error deleting MedicalHistory" });
            });
    });





///-------->Medications<--------------


const medicationSchema = new mongoose.Schema({
    medicine_id : Number, 
    p_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    d_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    drug : String ,
    dosage : String,
    a_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
});
const Medication = mongoose.model("Medication" , medicationSchema);



app.route("/medications")
    .get((req,res)=>{
        Medication.find({})
         .populate('p_id') // Populate the 'p_id' field, assuming it references the 'Patient' model
        .populate('d_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
        .populate('a_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
        .exec() // Execute the query
        .then(foundmedication => {
            res.status(200).json(foundmedication);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "An error occurred" });
        });
    })
    .post((req, res) => {
        const newMedication = new Medication(req.body);
        newMedication
            .save()
            .then(savedMedication => {
                res.status(201).json(savedMedication);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error saving Medical History" });
            });
    })
    .delete((req, res) => {
        Medication.deleteMany()
            .then(result => {
                res.status(204).send();
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Error deleting Medication" });
            });
    });



    //------------------> LAB RESULTS <-------------
 const labResultsSchema = new mongoose.Schema({
    p_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    d_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    test : String ,
    result : String,
    referenceRanges : String,
    facility : String,
    a_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
 });
const LabResults = mongoose.model("LabResults" , labResultsSchema);

app.route("/labResults")
        .get((req ,res)=>{
            LabResults.find({})
            .populate('p_id') // Populate the 'p_id' field, assuming it references the 'Patient' model
            .populate('d_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
            .populate('a_id') // Populate the 'd_id' field, assuming it references the 'Doctor' model
            .exec() // Execute the query   
            .then(foundresults=>{
                res.status(200).json(foundresults);
            }) 
            .catch(err =>{
                console.log(err);
                res.status(500).json({error : "An error occured"});
            });
        })
        .post((req, res )=>{
            const newLabResult = new LabResults(req.body);
            newLabResult
                .save()
                .then(savedLab =>{
                    res.status(201).json(savedLab);
                })
                .catch(err =>{
                    console.log(err);
                    res.status(500).json({error : "error saving lab result"})
                })
        })
        .delete((req, res) => {
            LabResults.deleteMany()
                .then(result => {
                    res.status(204).send();
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: "Error deleting Medication" });
                });
        });

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
