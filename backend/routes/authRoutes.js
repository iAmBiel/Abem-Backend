const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const mailer = require('../helpers/mailer')

const User = require("../models/user");

// register an user
router.post("/register", async (req, res) => {

    const name = req.body.name;
    const socialname = req.body.socialname;
    const email = req.body.email;
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    const address = req.body.address;
    const cityandstate = req.body.cityandstate;
    const cellphone = req.body.cellphone;
    const birthdate = req.body.birthdate;
    const mothername = req.body.mothername;
    const genre = req.body.genre;
    const cpf = req.body.cpf;

     // check for required fields
     if(name == null || email == null || password == null || confirmpassword == null || address == null || cityandstate == null || cellphone == null || birthdate == null || mothername == null || genre == null || cpf == null ) {
        return res.status(400).json({ error: "Por favor, preencha todos os campos." });
    }

    // confirm password validation
    if(password != confirmpassword) {
        return res.status(400).json({ error: "As senhas não conferem." });
    }

    // verify user email
    const isEmailExists = await User.findOne({ email: req.body.email });

    if (isEmailExists) {
        return res.status(400).json({ error: "O e-mail informado já está em uso." });
    }

    // creating password
    const salt = await bcrypt.genSalt(12);
    const reqPassword = req.body.password;

    const passwordHash = await bcrypt.hash(reqPassword, salt);
  
    const user = new User({
        name: name,
        socialname: socialname,
        email: email,
        password: passwordHash,
        address: address,
        cityandstate: cityandstate,
        cellphone: cellphone,
        birthdate: birthdate,
        mothername: mothername,
        genre: genre,
        cpf: cpf

    });

    try {      

        const newUser = await user.save();

        // create token
        const token = jwt.sign(
            // payload data
            {
            name: newUser.name,
            id: newUser._id,
            },
            "nossosecret"
        );
        
        // return token
        res.json({ error: null, msg: "Você realizou o cadastro com sucesso!", token: token, userId: newUser._id });

    } catch (error) {

        res.status(400).json({ error })
        
    }

});

// auth user
router.post("/login", async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;

    // check if user exists
    const user = await User.findOne({ email: email }).select('+password');

    if (!user) {
        return res.status(400).json({ error: "Não há usuário cadastrado com este e-mail!" });
    }

    // check if password match
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(400).json({ error: "Senha inválida" });
    }

    // create token
    const token = jwt.sign(
        // payload data
        {
        name: user.name,
        id: user._id,
        },
        "nossosecret"
    );

    // return token
    res.json({ error: null, msg: "Você está autenticado!", token: token, userId: user._id });

});

//forgot password
router.post("/forgot_password", async (req, res) => {
    const { email } = req.body

    try{

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Não há usuário cadastrado com este e-mail!" });
        }

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date()
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
            $set: {
              passwordResetToken: token,
              passwordResetExpires: now,
            }
          });
          
          mailer.sendMail({
          
          to: email,
          from: 'abemteste@gmail.com',
          subject: 'Recupere sua senha',
          html: `<p>Você esqueceu sua senha? Não tem problema, utilize esse token: ${token}</p>`,

          }, (err) => {
            if (err) {
              return res.status(400).json({ error: 'Não foi possível enviar o email de recuperação de senha' })
            }
            return res.send()
          }
        )

    } catch (error) {

        res.status(400).json({ error });

    }
});

//reset password
router.post("/reset_password", async (req, res) => {

    const { email, token, password} = req.body

    try{

        const user = await User.findOne({ email }).select('+passwordResetToken passwordResetExpires');

        if (!user) {
            return res.status(400).json({ error: "Não há usuário cadastrado com este e-mail!" });
        }

        if(token !== user.passwordResetToken){
            return res.status(400).json({ error: "token inválido!" });
        }

        const now = new Date()

        if(now > user.passwordResetExpires) {
        return res.status(400).json({ error: 'Token expirou, gere um novo' })
        }

        user.password = password;

        await user.save();

        res.send();


    } catch(err) {

        res.status(400).json({ error: "Não foi possível resetar a senha, tente de novo!" })

    }

})

module.exports = router;