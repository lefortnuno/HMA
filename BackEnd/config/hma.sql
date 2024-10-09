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
    prix float not null,
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