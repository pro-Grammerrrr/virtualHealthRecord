const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require("express-session");
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const { log } = require("console");
const filePath = path.join(__dirname, 'public', 'files', 'loginActivities', 'signUp.html');
const bcrypt = require('bcrypt');
const flash = require("connect-flash");
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect('mongodb://127.0.0.1:27017/vhr', { useNewUrlParser: true, useUnifiedTopology: true });
app.use(session({ secret: "5DED5486FFDE459BC62C69A879C93", resave: true, saveUninitialized: true }));
app.use(flash()); // Initialize connect-flash
// Passport configuration
app.use(session({ secret: "5DED5486FFDE459BC62C69A879C93", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    done(null, user.id); // Serialize the user by their ID
});
passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id).exec();
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
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
app.get('/docSignUp.html', (req, res) => {
    res.sendFile(__dirname + '/docSignUp.html'); // Use the filePath variable
});
app.get('/doctor_registration', (req, res) => {
    res.sendFile(__dirname + '/doctor_registration.html'); // Use the filePath variable
});
//Registration Model
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
});

// Define the validPassword method on the User model
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
}
const User = mongoose.model("User", userSchema);
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });

            if (!user) {
                return done(null, false, { message: "User not found" });
            }

            if (!user.validPassword(password)) {
                return done(null, false, { message: "Incorrect password" });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));
// Registration route
app.post('/signUp', (req, res) => {
    // Check the role submitted in the registration form
    const role = req.body.role;
    const newUser = new User(req.body);
    // Hash 
    const password = req.body.password;
    const saltRounds = 10; 

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Error creating account" });
        } else {
            newUser.password = hash; // Set the hashed password
            newUser.save()
                .then(savedUser => {
                    req.session.userId = savedUser._id;
                    console.log('User ID:', savedUser._id);

                    if (role === "doctor") {
                        // Redirect doctors to the doctor registration form
                        res.redirect('/doctor_registration?userId=' + savedUser._id);
                    } else {
                        // Redirect patients to the patient registration form
                        res.redirect('/registration?userId=' + savedUser._id);
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: "Error creating account" });
                });
        }
    });
});
const patientSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
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
    medicalHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicalHistory'
        }
    ],

    medications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medication'
        }
    ],

    labResults: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabResults'
        }
    ]
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
            _id: req.session.userId,
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
        res.redirect('/signUp.html');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error during patient registration" });
    }
});
// Loggin UP the user 

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error(err);
            return res.redirect('/signUp.html'); // Redirect to the login page
        }
        if (!user) {
            console.log('Login failed:', info && info.message); // Check if info exists
            return res.redirect('/signUp.html'); // Redirect to the login page
        }

        // Use bcrypt to compare the provided password with the stored hash
        bcrypt.compare(req.body.password, user.password, (bcryptErr, result) => {
            if (bcryptErr || !result) {
                console.log('Login failed: Incorrect password');
                return res.redirect('/signUp.html'); // Redirect to the login page
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error(loginErr);
                    return res.redirect('/signUp.html'); // Redirect to the login page
                }
                console.log('Login successful');
                // console.log(user);
                return res.redirect('/patients/:' + user._id);
            });
        });
    })(req, res, next);
});
// Route for listing all patients
app.route("/patients")
    .get(function (req, res) {
        // Patient.find({})
        // .populate('_id')
        // .exec()
        //     .then(foundPatients => {
        //         res.status(200).json(foundPatients);
        //     })
        //     .catch(err => {
        //         console.error(err);
        //         res.status(500).json({ error: "An error occurred while fetching patients" });
        //     });
        res.sendFile(__dirname + '/patients.html')
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
    .get(async (req, res) => {
        try {
            // Fetch the patient's profile
            const patient = await Patient.findById(req.params.userId.slice(1));
            if (!patient) {
                return res.status(404).json({ message: 'Patient Not found' });
            }
            const medicalHistoryEntries = await MedicalHistory.find({ p_id: patient._id });
            const medications = await Medication.find({ p_id: patient._id });
            const labResults = await LabResults.find({ p_id: patient._id });

            // Fetch userAppointments within the same route handler
            const userAppointments = await Appointment.find({ p_id: patient._id })
                .populate('p_id', 'Fname Lname')
                .populate('d_id', 'fName lName')
                .exec();

            // Render the patient dashboard with all the data, including userAppointments
            res.render('patients', {
                patient: patient,
                medicalHistoryEntries: medicalHistoryEntries,
                medications: medications,
                labResults: labResults,
                userAppointments: userAppointments,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })
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
    fName: String, // First name
    lName: String,  // Last nam
    gender: String, // Gender
    dateOfBirth: Date, // Date of Birth
    email: String, // Email for communication
    ph: Number, // Phone number (you can adjust the type as needed)
    address: String, // Work address or office location
    licenseNumber: String, // Medical license number (you can adjust the type as needed)
    specality: String, // Medical specialty
    qualifications: String, // Medical qualifications and certifications
    experience: String, // Work experience including past positions and institutions
    officeHours: String, // Regular office hours or availability
    appointmentSlots: String, // List of available appointment slots for patients to schedule

    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],

    // Add more fields as needed
});
const Doctor = mongoose.model("Doctor", doctorSchema);
app.post('/doctor_registration', async (req, res) => {
    // console.log('User ID:', req.session.userId);
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
        const newDoctor = new Doctor({
            // Doctor's data
            _id: req.session.userId, // Assuming this is the doctor's unique identifier
            fName: req.body.firstName, // First name
            lName: req.body.lastName, // Last name
            gender: req.body.gender, // Gender
            dateOfBirth: req.body.dateOfBirth, // Date of Birth
            email: req.body.email, // Email for communication
            ph: req.body.phoneNumber, // Phone number
            address: req.body.address, // Work address or office location
            licenseNumber: req.body.licenseNumber, // Medical license number
            specality: req.body.specialty, // Medical specialty
            qualifications: req.body.qualifications, // Medical qualifications and certifications
            experience: req.body.experience, // Work experience including past positions and institutions
            officeHours: req.body.officeHours, // Regular office hours or availability
            appointmentSlots: req.body.appointmentSlots, // List of available appointment slots for patients to schedule
        
            // Additional fields can be added here
        });

        // Save the new patient record
        const savedDocument = await newDoctor.save();
        res.redirect('/docSignUp.html');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error during Docotrs registration" });
    }
});
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

//For a Particular Doctor Login 
app.post('/docLogin', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error(err);
            return res.redirect('/docSignUp.html'); // Redirect to the login page
        }
        if (!user) {
            console.log('Login failed:', info && info.message); // Check if info exists
            return res.redirect('/docSignUp.html'); // Redirect to the login page
        }

        // Add a condition to check if the user is a doctor
        bcrypt.compare(req.body.password, user.password, (bcryptErr, result) => {
            if (bcryptErr || !result) {
                console.log('Login failed: Incorrect password');
                return res.redirect('/docSignUp.html'); // Redirect to the login page
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error(loginErr);
                    return res.redirect('/docSignUp.html'); // Redirect to the login page
                }
                console.log('Login successful');
                // console.log(user);
                return res.redirect('/doctors/:' + user._id);
            });
        });
    })(req, res, next);
});

app.route('/doctors/:userId')
    .get(async (req, res) => {
        try {
            const uid = req.params.userId;

            const doctor = await Doctor.findById(uid.slice(1));
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            // Fetch the doctor's appointments
            const appointments = await Appointment.find({ d_id: doctor._id }).populate('p_id', 'Fname Lname').exec();

            // Fetch the list of patients
            const patients = await Patient.find({}); // You can add conditions if needed

            // Customize the displayInfo property for each patient
            patients.forEach(patient => {
                // Customize the displayInfo based on your requirements
                patient.displayInfo = `Some custom information for ${patient.Fname} ${patient.Lname}`;
            });

            // Render the doctor's dashboard with appointments and customized patient information
            res.render('doctors', { doctor: doctor, doctorAppointments: appointments, patients: patients });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


////------------->Appointments Schema <------------
const apponitmentSchema = new mongoose.Schema({
    p_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    d_id :  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    // venue : String,
    date : Date,
    time : String,
    notes : String,
    diagnose_condition : String,
    appointmentStatus : String,
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
    .post(function (req, res) {
        // Create a new appointment
        const newAppointment = new Appointment(req.body);
        // Assign the current user's ID (patient ID) to the p_id field
        newAppointment.p_id = req.user.id;
        newAppointment.appointmentStatus = "Pending";
        // Save the appointment
        newAppointment.save()
            .then(savedAppointment => {
                // Update the patient's appointment reference
                Patient.findByIdAndUpdate(req.user.id, { $push: { appointments: savedAppointment._id } })
                    .then(() => {
                        // Update the doctor's appointment reference
                        Doctor.findByIdAndUpdate(req.body.d_id, { $push: { appointments: savedAppointment._id } })
                            .then(() => {
                                res.status(200).json(savedAppointment);
                            })
                            .catch(err => {
                                console.log(err);
                                res.status(500).json({ error: "An error occurred when updating the doctor" });
                            });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({ error: "An error occurred when updating the patient" });
                    });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: "An error occurred" });
            });
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

    app.get('/getAppointments', (req, res) => {
        // Fetch the user's appointment data, similar to the previous example
        // Replace this with your actual Mongoose query to fetch appointments associated with the user ID
        console.log('getAppointments route called')
        // For example:
        Appointment.find({ p_id: req.user.id })
            .populate('d_id')
            .exec()
            .then(appointments => {
                res.json({ userAppointments: appointments });
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "An error occurred while fetching appointments" });
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
        app.get('/doctors/appointments/:appointmentId', async (req, res) => {
            try {
                // Fetch the appointment details using the appointmentId
                const appointmentId = req.params.appointmentId;
        
                // Fetch the appointment and other necessary data using Mongoose
                const appointment = await Appointment
                    .findById(appointmentId)
                    .populate('p_id', 'Fname Lname')
                    .exec();
        
                if (!appointment) {
                    return res.status(404).json({ message: 'Appointment Not found' });
                }
        
                // Render the appointment details page with the appointment data
                res.render('appointment-details', {
                    appointment: appointment,
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while fetching appointment details' });
            }
        });
        
app.post('/appointments/accept/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        // Update the appointment's status to "Accepted" in your database
        // Replace the following code with your actual database update logic
        await Appointment.findByIdAndUpdate(appointmentId, { appointmentStatus: 'Accepted' });

        // Retrieve the appointment data to get the patient's ID
        const appointment = await Appointment.findById(appointmentId);

        // Check if the appointment was found
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Push the patient's ID into the doctor's 'patients' array
        await Doctor.findByIdAndUpdate(appointment.d_id, { $push: { patients: appointment.p_id } });

        // Redirect to the appointment details page or any other appropriate page
        res.redirect('/appointments/' + appointmentId);
    } catch (err) {
        res.status(500).json({ error: "An error occurred while accepting the appointment" });
    }
});
// Handle appointment rejection
app.post('/appointments/reject/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        // Update the appointment's status to "Rejected" in your database
        // Replace the following code with your actual database update logic
        await Appointment.findByIdAndUpdate(appointmentId, { appointmentStatus: 'Rejected' });
        await Doctor.findByIdAndUpdate(req.params.userId < {})
        // Redirect to the appointment details page or any other appropriate page
        res.redirect('/appointments/' + appointmentId);
    } catch (err) {
        res.status(500).json({ error: "An error occurred while rejecting the appointment" });
    }
});
app.get('/doctors/patients/:patientId', async (req, res) => {
    try {
        const patientId = req.params.patientId;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid patient ID' });
        }

        const patient = await Patient.findById(patientId);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Render a page to view the patient's details
        res.render('view-patient-details', { patient: patient });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching patient details' });
    }
});
app.get('/medical-history-form', (req, res) => {
    // Retrieve the doctor's and patient's IDs from the request or your session data
    const doctorId = req.user.id; 
    const patientId = req.query.patientId;
console.log(doctorId);
    // Render the medical history form with the doctor's, patient's, and appointment IDs
    res.render('check-patient', { doctorId, patientId });
});

  
// Making the patients medical history
app.post('/save-medical-data', async (req, res) => {
    try {
        const doctorId = req.body.doctorId;
        const patientId = req.body.patientId;
        const medicalHistory = new MedicalHistory({
            d_id: doctorId,
            p_id: patientId,
            condition: req.body.condition,
            stage: req.body.stage,
        });
        const medication = new Medication({
            d_id: doctorId,
            p_id: patientId,
            drug: req.body.drug,
            dosage: req.body.dosage,
        });
        const labResults = new LabResults({
            d_id: doctorId,
            p_id: patientId,
            test: req.body.test,
            result: req.body.result,
            referenceRanges: req.body.referenceRanges,
            facility: req.body.facility,
        });

        // Save all three data types to the database
        await Promise.all([medicalHistory.save(), medication.save(), labResults.save()]);
        // Retrieve the patient document and push the medical data into an array
        const patient = await Patient.findById(patientId);
        if (patient) {
            patient.medicalHistory.push(medicalHistory);
            patient.medications.push(medication);
            patient.labResults.push(labResults);

            // Save the updated patient document
            await patient.save();
        }

        res.send("Data saved successfully"); // Send a response or redirect as needed
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during data submission' });
    }
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});
