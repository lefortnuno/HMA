drop database hma;

create database hma;

use hma;

create table mpampiasa(
    id int(11) not null auto_increment,
    nom varchar(100) not null,
    prenom varchar(250) not null,
    pwd varchar(250) not null,
    idPS varchar(100) not null,
    karazana boolean default 0,
    -- 0 = False = USAGER -- 1 = TRUE = ADMIN
    primary key(id),
    unique index `id_unique` (`id` desc),
    unique index `idPS_unique` (`idPS`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = latin1;

create table serivisy(
    id int(11) not null auto_increment,
    nom varchar(300) not null,
    fandrefesana varchar(25) not null,
    karazana boolean default 0,
    -- 0 = False = MATERIEL -- 1 = TRUE = ARA-TSAINA
    primary key(id),
    unique index `id_unique` (`id` desc),
    unique index `nom_unique` (`nom`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = latin1;

create table botika(
    id int(11) not null auto_increment,
    nom varchar(300) not null,
    prix float not null,
    idB int(11) not null,
    primary key(id),
    unique index `id_unique` (`id` desc),
    index `serivisy_idBx` (`idB` desc),
    constraint idB foreign key (idB) references hma.serivisy(id) on delete CASCADE on update CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = latin1;

create table hetsika(
    id int(11) not null auto_increment,
    date date,
    coms varchar(300) default null,
    qte float not null,
    karazana boolean default 0,
    -- 0 = False = MIVOKA -- 1 = TRUE = MIDITRA
    idS int(11) not null,
    idM int(11) not null,
    primary key(id),
    unique index `id_unique` (`id` desc),
    index `serivisy_idx` (`idS` desc),
    index `mpampiasa_idx` (`idM` desc),
    constraint idS foreign key (idS) references hma.serivisy(id) on delete CASCADE on update CASCADE,
    constraint idM foreign key (idM) references hma.mpampiasa(id) on delete CASCADE on update CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = latin1;

-- - CREATION UTILISATEUR ADMIN ------------------
insert into
    mpampiasa (nom, prenom, pwd, idPS, karazana)
values
    (
        'LEFORT',
        'Nomenjanahary Nuno',
        '$2b$10$8zSCozIrTJsiAVYxBTAL7OkITjn3XwNnns.0.btbkV6e4PMvz/oqu',
        -- 7590 
        'Trofel',
        1
    ),
    (
        'TROFEL',
        'Nomenjanahary Nono',
        '$2b$10$8zSCozIrTJsiAVYxBTAL7OkITjn3XwNnns.0.btbkV6e4PMvz/oqu',
        -- 7590 
        'Lefort',
        0
    );

-- ═══════════════════════════════════════════════════════════
-- MODULE GESTION LOYER
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS locataire (
    id          INT(11)      NOT NULL AUTO_INCREMENT,
    nom         VARCHAR(100) NOT NULL,
    prenom      VARCHAR(100) DEFAULT NULL,
    chambre     VARCHAR(10)  NOT NULL,
    etage       ENUM('RDC','1ER') NOT NULL DEFAULT 'RDC',
    loyer       INT(11)      NOT NULL,
    tel         VARCHAR(30)  DEFAULT NULL,
    email       VARCHAR(150) DEFAULT NULL,
    dateEntree  DATE         DEFAULT NULL,
    actif       TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE INDEX id_unique (id DESC)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS facture_jirama (
    id           INT(11)   NOT NULL AUTO_INCREMENT,
    mois         TINYINT   NOT NULL,
    annee        YEAR      NOT NULL,
    prixUnitaire FLOAT     NOT NULL,
    montantTotal FLOAT     DEFAULT 0,
    dateFacture  DATE      DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_mois_annee (mois, annee)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS consommation_locataire (
    id           INT(11) NOT NULL AUTO_INCREMENT,
    locataireId  INT(11) NOT NULL,
    factureId    INT(11) NOT NULL,
    indexPrev    FLOAT   DEFAULT 0,
    indexCurr    FLOAT   DEFAULT 0,
    consommation FLOAT   DEFAULT 0,
    montantJIRAMA FLOAT  DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (locataireId) REFERENCES locataire(id)      ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (factureId)   REFERENCES facture_jirama(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS paiement_loyer (
    id            INT(11)  NOT NULL AUTO_INCREMENT,
    locataireId   INT(11)  NOT NULL,
    mois          TINYINT  NOT NULL,
    annee         YEAR     NOT NULL,
    montantLoyer  INT(11)  NOT NULL DEFAULT 0,
    montantJIRAMA FLOAT    DEFAULT 0,
    statut        ENUM('PAYE','PARTIEL','IMPAYE') NOT NULL DEFAULT 'IMPAYE',
    datePaiement  DATE     DEFAULT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (locataireId) REFERENCES locataire(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS depense_immo (
    id          INT(11)      NOT NULL AUTO_INCREMENT,
    description VARCHAR(300) NOT NULL,
    montant     FLOAT        NOT NULL,
    mois        TINYINT      NOT NULL,
    annee       YEAR         NOT NULL,
    categorie   VARCHAR(100) DEFAULT 'Autre',
    date        DATE         DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;

-- ═══════════════════════════════════════════════════════════
-- MODULE VITRINE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bien_immo (
    id               INT(11)      NOT NULL AUTO_INCREMENT,
    type             ENUM('CHAMBRE','VILLA') NOT NULL DEFAULT 'CHAMBRE',
    titre            VARCHAR(300) NOT NULL,
    description      TEXT         DEFAULT NULL,
    prix             FLOAT        NOT NULL DEFAULT 0,
    surface          FLOAT        DEFAULT NULL,
    localisation     VARCHAR(300) DEFAULT NULL,
    disponible       TINYINT(1)   NOT NULL DEFAULT 1,
    nbChambres       INT(11)      DEFAULT NULL,
    nbPieces         INT(11)      DEFAULT NULL,
    photos           TEXT         DEFAULT NULL,
    caracteristiques TEXT         DEFAULT NULL,
    createdAt        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE INDEX id_unique (id DESC)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;

-- ═══════════════════════════════════════════════════════════
-- Requêtes de test (commentées)
-- ═══════════════════════════════════════════════════════════

-- SELECT * FROM locataire ORDER BY etage, chambre;
-- SELECT * FROM facture_jirama ORDER BY annee DESC, mois DESC;
-- SELECT * FROM paiement_loyer WHERE annee = 2026;
-- SELECT * FROM depense_immo WHERE mois = 5 AND annee = 2026;
-- SELECT * FROM bien_immo WHERE disponible = 1;

SELECT
    hetsika.id as idh,
    hetsika.karazana as hk,
    serivisy.nom as snom,
    serivisy.karazana as sk,
    mpampiasa.nom as mnom,
    date,
    prenom,
    prix,
    fandrefesana,
    coms,
    qte,
    idS,
    idM
FROM
    hetsika,
    mpampiasa,
    serivisy
WHERE
    (
        mpampiasa.id = hetsika.idM
        AND serivisy.id = hetsika.idS
    )
    AND idM = 1
    AND date between '2024-08-14'
    and '2024-08-17'
ORDER BY
    idh DESC;