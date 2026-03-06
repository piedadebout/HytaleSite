CREATE TABLE USER(
    Id varchar(255) primary key unique;
    Usuario varchar(20) NOT NULL;
    Email varchar(50) NOT NULL;
    Password varchar(20) NOT NULL;
)