"use strict";
const Boutique = require("../models/boutique.model");

module.exports.addBoutique = (req, res) => {
  const { nom, prix, idB } = req.body;
  const newBoutique = { nom, prix, idB};

  Boutique.addBoutique(newBoutique, (err, resp) => {
    if (err) {
      res.send(err);
    } else {
      res.send(resp);
    }
  });
};

module.exports.getAllBoutiques = (req, res) => {
  Boutique.getAllBoutiques((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getIdBoutique = (req, res) => {
  Boutique.getIdBoutique(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getMyTotalOfBoutique = (req, res) => {
  Boutique.getMyTotalOfBoutique((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.updateBoutique = (req, res) => {
  let { nom, prix, idB } = req.body;
  const updateBoutique = { nom, prix,idB};

  Boutique.updateBoutique(updateBoutique, req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.deleteBoutique = (req, res) => {
  Boutique.deleteBoutique(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.searchBoutique = (req, res) => {
  const { val } = req.body; 
  
  Boutique.searchBoutique({ val }, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.trieBoutique = (req, res) => {
  const { val } = req.body;

  if (val == true || val == false) {
    Boutique.trieBoutiqueByType({ val }, (err, resp) => {
      if (!err) {
        res.send(resp);
      } else {
        res.send(err);
      }
    });
  } else {
    Boutique.trieBoutiqueByUnite({ val }, (err, resp) => {
      if (!err) {
        res.send(resp);
      } else {
        res.send(err);
      }
    });
  }
};
