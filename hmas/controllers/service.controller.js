"use strict";
const Service = require("../models/service.model");

module.exports.addService = async (req, res) => {
  const { nom, prix, fandrefesana, karazana } = req.body;
  const newService = { nom, prix, fandrefesana, karazana };
 
  try {
    const resp = await Service.addService(newService);
    res.send(resp);
  } catch (error) {
    res.status(500).send(err);
  }
};

module.exports.getAllServices = (req, res) => {
  Service.getAllServices((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getIdService = (req, res) => {
  Service.getIdService(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getMyTotalOfService = (req, res) => {
  Service.getMyTotalOfService((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.updateService = (req, res) => {
  let { nom, prix, fandrefesana, karazana } = req.body;
  const updateService = { nom, prix, fandrefesana, karazana };

  Service.updateService(updateService, req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.deleteService = (req, res) => {
  Service.deleteService(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.searchService = (req, res) => {
  const { val } = req.body;

  Service.searchService({ val }, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.trieService = (req, res) => {
  const { val } = req.body;

  if (val == true || val == false) {
    Service.trieServiceByType({ val }, (err, resp) => {
      if (!err) {
        res.send(resp);
      } else {
        res.send(err);
      }
    });
  } else {
    Service.trieServiceByUnite({ val }, (err, resp) => {
      if (!err) {
        res.send(resp);
      } else {
        res.send(err);
      }
    });
  }
};
