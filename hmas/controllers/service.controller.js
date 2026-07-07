"use strict";
const Service = require("../models/service.model");
const { sendErr } = require("../utils/http");

module.exports.addService = (req, res) => {
  const { nom, prix, fandrefesana, karazana } = req.body;
  const newService = { nom, prix, fandrefesana, karazana };

  Service.addService(newService, (err, resp) => {
    if (err) {
      sendErr(res, err);
    } else {
      res.send(resp);
    }
  });
};

module.exports.getAllServices = (req, res) => {
  Service.getAllServices((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

module.exports.getIdService = (req, res) => {
  Service.getIdService(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

module.exports.getMyTotalOfService = (req, res) => {
  Service.getMyTotalOfService((err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
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
      sendErr(res, err);
    }
  });
};

module.exports.deleteService = (req, res) => {
  Service.deleteService(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
    }
  });
};

module.exports.searchService = (req, res) => {
  const { val } = req.body; 
  
  Service.searchService({ val }, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      sendErr(res, err);
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
        sendErr(res, err);
      }
    });
  } else {
    Service.trieServiceByUnite({ val }, (err, resp) => {
      if (!err) {
        res.send(resp);
      } else {
        sendErr(res, err);
      }
    });
  }
};
