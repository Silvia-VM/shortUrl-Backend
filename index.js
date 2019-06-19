const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080; //PORT stocké dans une variable
//connexion avec la base de donnée locale
mongoose.connect("mongodb://localhost/short-url-app", {
  useNewUrlParser: true
});
//création modèle
const Url = mongoose.model("Url", {
  url: String,
  short_url: String,
  visits: Number
});
//fonction qui va retourner 5 caractères aléatoires pour chaque url
function aleatoire(size) {
  let array_letters = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
  ];

  let result = "";
  //boucle for qui génère une suite de carateres aléatoire de la longueur passée en paramètre
  for (i = 0; i < size; i++) {
    // renvoie aléatoirement minuscules ou majuscules
    if (Math.round(Math.random() * 1)) {
      result += array_letters[
        Math.floor(Math.random() * array_letters.length)
      ].toUpperCase();
    } else {
      result += array_letters[
        Math.floor(Math.random() * array_letters.length)
      ].toLowerCase();
    }
  }
  return result;
}
// fonction qui vérifie si l'url est du bon format
function Url_Valide(UrlTest) {
  let regexp = new RegExp(
    "^((http|https)://){1}(www[.])?([a-zA-Z0-9]|-)+([.][a-zA-Z0-9(-|/|=|?)?]+)+$"
  );
  return regexp.test(UrlTest);
}
// fonction qui vérifie si l'url existe déjà
const Url_Inexistant = async UrlTest => {
  // crée un tableau qui contient toutes les urls de la base de données
  let array_urls = [];
  const urls = await Url.find();
  for (let i = 0; i < urls.length; i++) {
    array_urls.push(urls[i].url);
  }
  // Test si l'url saisie par l'utilisateur est dans ce tableau
  if (array_urls.indexOf(UrlTest) === -1) {
    return true;
  } else {
    return false;
  }
};

/*route url qui renvoie a la base de données les urls reduites avec les 5 caractéres aléatoires
 et le nb de visites sur le site */
app.post("/create", async (req, res) => {
  let url_inexistant = await Url_Inexistant(req.body.url);
  // on ajoute l'url si bon format et n'existe pas deja
  if (Url_Valide(req.body.url) && url_inexistant) {
    let alea = aleatoire(5);
    try {
      const newUrl = new Url({
        url: req.body.url,
        short_url: `http://localhost:${PORT}/${alea}`,
        visits: 0
      });

      await newUrl.save();
      res.json({ message: "Created url" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(400).json({ error: "url invalid" });
  }
});

// route qui affiche l'ensemble des modèles Url
app.get("/", async (req, res) => {
  try {
    const urls = await Url.find();
    res.json(urls);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// fonction qui crée un tableau contenant les aléas
async function tabAlea() {
  let array_alea = [];
  const urls = await Url.find();
  for (let url in urls) {
    array_alea.push(urls[url].short_url.split("/")[3]);
  }
  return array_alea;
}

// force à actualiser le tableau des aléas en continu
setInterval(
  () =>
    // pour chaque aléa crée une route et augmente nb de visites
    tabAlea().then(a => {
      let b = [...a];
      b.forEach(async alea => {
        app.get("/" + alea, async (req, res) => {
          try {
            const url = await Url.findOne({
              short_url: `http://localhost:${PORT}/${alea}`
            });

            url.visits += 1;
            await url.save();

            res.status(301).redirect(url.url);
          } catch (error) {
            res.status(400).json({ message: error.message });
          }
        });
      });
    }),
  2000
);

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
