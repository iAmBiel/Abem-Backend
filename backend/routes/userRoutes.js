const router = require("express").Router();
const bcrypt = require("bcrypt");

const User = require("../models/user");
const Solicitation = require("../models/solicitation");

// middlewares
const verifyToken = require("../helpers/check-token");

// helpers
const getUserByToken = require("../helpers/get-user-by-token");

// get an user
router.get("/:id", verifyToken, async (req, res) => {

    const id = req.params.id;

    // verify user
    try{

        const user = await User.findOne({ _id: id }, {password: 0});

        res.json({ error: null, user });

    } catch(err) {

        return res.status(400).json({ error: "O usuário não existe!" });

    }

});

// update an user
router.put("/", verifyToken, async (req, res) => {

    const token = req.header("auth-token");
    const user = await getUserByToken(token);
    const userReqId = req.body.id;
    const password = req.body.password;
    const confirmPassword = req.body.confirmpassword;

    const userId = user._id.toString();

    // check if user id is equal token user id
    if(userId != userReqId) {
  
        res.status(401).json({ error: "Acesso negado!" });
    
      }

    // creating user object
    const updateData = {
        name: req.body.name,
        socialname: req.body.socialname,
        email: req.body.email,
        address: req.body.address,
        cityandstate: req.body.cityandstate,
        cellphone: req.body.cellphone,
        birthdate: req.body.birthdate,
        mothername: req.body.mothername,
        genre: req.body.genre,
        cpf: req.body.cpf
      };

      // check if password match
    if(password != confirmPassword) {

        res.status(401).json({ error: "As senhas não conferem." });
      
      // change password
      } else if(password == confirmPassword && password != null) {
  
        // creating password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // add password to data
        updateData.password = passwordHash;

        const reqPassword = req.body.password;
  
        req.body.password = passwordHash;
  
      }
    
      try {      
    
        // returns updated data
        const updatedUser = await User.findOneAndUpdate({ _id: userId }, { $set:  updateData}, {new: true});
        res.json({ error: null, msg: "Usuário atualizado com sucesso!", data: updatedUser });
    
      } catch (error) {
    
        res.status(400).json({ error })
          
      }
  
});

// get users
router.get("/", async (req,res) =>{

  try{

      const people = await User.find()

      res.status(200).json(people)

  } catch(error) {

      res.status(500).json({ error: error })

  }

});

// delete user
router.delete("/:id", async (req, res) => {

  const id = req.params.id;

  const user = await User.findOne({ _id: id }, {password: 0});

  if(!user){

    res.status(402).json({ msg: "O usuário não foi encontrado!" })
    return

  }

  try{

    await User.deleteOne({_id: id})

    res.status(200).json({ msg: "O usuário foi removido com sucesso!", user: user })

  } catch(error){

    res.status(500).json({ error: error })

  }

});

// create solicitation
router.post("/solicitation", verifyToken, async (req,res) =>{

  const servicearea = req.body.servicearea;
  const reason = req.body.reason;
  const details = req.body.details;
  

  // validations
  if(servicearea == "null" || details == "null") {
    return res.status(400).json({ error: "Preencha todos os campos." });
  } 

  // verify user 
  const token = req.header("auth-token");

  const userByToken = await getUserByToken(token);
  
  const userId = userByToken._id.toString();

  const sendAt = new Date();

  const formatter = Intl.DateTimeFormat("pt-BR",{
    dateStyle: "short",
    timeStyle: "short"
  });

  const dateFormat = formatter.format(sendAt); 

  try {

    const user = await User.findOne({ _id: userId }, {socialname: 0, cityandstate: 0, address: 0, cellphone: 0, birthdate: 0, mothername: 0, genre: 0, cpf: 0});

    const solicitation = new Solicitation({
      servicearea: servicearea,
      reason: reason,
      details: details,
      userId: user._id.toString(),
      user: user
    });

    try {

      const newSolicitation = await solicitation.save();
      res.json({ error: null, msg: "Solicitação enviada com sucesso!", date: dateFormat, data: newSolicitation, });

    } catch(error) {

      res.status(400).json({ error })

    }

  } catch(err) {

    res.status(400).json({ error: "Acesso negado." })

  }

});

// get solicitations

router.get("/solicitation/all", verifyToken, async (req, res) => {

  try { 
    
    const solicitations = await Solicitation.find().populate('user');
    res.json({ error: null, solicitations: solicitations});

  } catch (error) {

    res.status(400).json({ error })
      
  }

});


// delete solicitation
router.delete("/solicitation/:id", verifyToken, async (req, res) => {

  const id = req.params.id;

  const solicitation = await Solicitation.findOne({ _id: id });

  if(!solicitation){

    res.status(402).json({ msg: "Solicitação não foi encontrada!" })
    return

  }

  try{

    await Solicitation.deleteOne({_id: id})

    res.status(200).json({ msg: "A solicitação foi removida com sucesso!", solicitation: solicitation})

  } catch(error){

    res.status(500).json({ error: error })

  }

});


module.exports = router;