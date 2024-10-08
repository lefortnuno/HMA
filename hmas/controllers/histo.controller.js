"use strict";
const Histo = require("../models/histo.model");

module.exports.addHisto = (req, res) => {
  let { coms, qte, karazana, idS, idM } = req.body;
  const date = new Date();
  const newHisto = { date, coms, qte, karazana, idS, idM };

  Histo.addHisto(newHisto, (err, resp) => {
    if (err) {
      res.send(err);
    } else {
      res.send(resp);
    }
  });
};

module.exports.getAllMyHisto = (req, res) => {
  Histo.getAllMyHisto(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getAllMyInComingHisto = (req, res) => {
  Histo.getAllMyInComingHisto(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getMyTotalOfInComing = (req, res) => {
  Histo.getMyTotalOfInComing(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getAllMyOutGoingHisto = (req, res) => {
  Histo.getAllMyOutGoingHisto(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getMyTotalOfOutGoing = (req, res) => {
  Histo.getMyTotalOfOutGoing(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.getIdHisto = (req, res) => {
  Histo.getIdHisto(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.updateMyHisto = (req, res) => {
  let { coms, qte, karazana } = req.body;
  const updateHisto = { coms, qte, karazana };

  Histo.updateMyHisto(updateHisto, req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.deleteMyHisto = (req, res) => {
  Histo.deleteMyHisto(req.params.id, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.searchSomeHisto = (req, res) => {
  const { val, idM } = req.body;

  Histo.searchSomeHisto({ val, idM }, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};

module.exports.filtreHisto = (req, res) => {
  const { date1, date2, idM } = req.body;
  const date = { date1, date2, idM };

  Histo.filtreHisto(date, (err, resp) => {
    if (!err) {
      res.send(resp);
    } else {
      res.send(err);
    }
  });
};
