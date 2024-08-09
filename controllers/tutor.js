const { marom_db } = require("../db");
const { shortId, fs, path } = require("../modules");
const moment = require("moment-timezone");
const {
  insert,
  updateById,
  getAll,
  find,
  findByAnyIdColumn,
  update,
  parameteriedUpdateQuery,
  parameterizedInsertQuery,
} = require("../helperfunctions/crud_queries");
const {
  deleteFolderContents,
  deleteFolder,
  commissionAccordingtoNumOfSession,
  calcNet,
} = require("../constants/helperfunctions");
const { exec } = require("child_process");
const sql = require("mssql");
const COMMISSION_DATA = require("../constants/tutor");
const educationSchema = require("../schema/tutor/education");
const {
  checkSessionStatus,
} = require("../helperfunctions/generalHelperFunctions");
const TutorSetup = require("../schema/tutor/Setup");
const Accounting = require("../schema/tutor/Accounting");

const { sendErrors } = require("../helperfunctions/handleReqErrors");

const account = process.env.AZURE_ACCOUNT_NAME;
const { BlobServiceClient } = require("@azure/storage-blob");
const Discounts = require("../schema/tutor/Discounts");
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net/?${process.env.AZURE_BLOB_SAS_TOKEN}`
);
const containerClient = blobServiceClient.getContainerClient(
  process.env.AZURE_BLOB_CONT_NAME
);

let post_new_subject = (req, res) => {
  let { faculty, subject, reason, AcademyId, facultyId } = req.body;

  let date = new Date();

  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      var resultSet = poolConnection.request().query(
        `
                    INSERT INTO "NewTutorSubject"(faculty, subject, date, AcademyId, reason, facultyID)
                    VALUES ('${faculty}', '${subject}', '${date}', '${AcademyId}', '${reason}', '${facultyId}')
                    `
      );

      resultSet
        .then((result) => {
          result.rowsAffected[0] === 1
            ? res.send({ bool: true, mssg: "Data Was Successfully Saved" })
            : res.send({
                bool: false,
                mssg: "Data Was Not Successfully Saved",
              });
        })
        .catch((err) => {
          console.log(err);
          res.send({ bool: false, mssg: "Data Was Not Successfully Saved" });
        });
    }
  });
};

let subjects = (req, res) => {
  let { id } = req.query;
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      var resultSet = await poolConnection.request().query(
        `SELECT Id,FacultyId,SubjectName 
        FROM 
        Subjects WHERE CONVERT(VARCHAR, FacultyId) =  '${id}' `
      );

      res.send(resultSet);
    }
  });
};

const subject_already_exist = async (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);

      if (poolConnection) {
        const result = await poolConnection.request().query(
          // find('NewTutorSubject', req.params, 'And', { subject: 'varchar' })
          `SELECT *
                    FROM NewTutorSubject
                    WHERE LOWER(cast(subject as varchar)) = LOWER('${req.params.subject}');`
        );

        if (result.recordset.length) {
          return res.status(200).send({
            message: "request exist",
            faculties: result.recordset.map((subject) => subject.faculty),
          });
        } else {
          const result = await poolConnection.request().query(
            // find('Subjects', { SubjectName: req.params.subject }, 'AND', { SubjectName: 'varchar' })
            `SELECT *
                        FROM Subjects as s join Faculty as f on
                        s.FacultyId = f.id
                        WHERE LOWER(cast(SubjectName as varchar)) = LOWER('${req.params.subject}');`
          );
          if (result.recordset.length) {
            return res.status(200).send({
              message: "subject exist",
              faculties: result.recordset.map((subject) => subject.Faculty),
            });
          } else {
            res.status(200).send({ subjectExist: false, faculties: [] });
          }
        }
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

// let post_form_one = (req, res) => {
//   let {
//     fname,
//     mname,
//     sname,
//     email,
//     pwd,
//     acadId,
//     cell,
//     add1,
//     add2,
//     city,
//     state,
//     zipCode,
//     country,
//     timeZone,
//     response_zone,
//     intro,
//     motivation,
//     headline,
//     photo,
//     video,
//     grades,
//     userId,
//   } = req.body;

//   let UserId =
//     mname.length > 0
//       ? fname + "." + " " + mname[0] + "." + " " + sname[0] + shortId.generate()
//       : fname + "." + " " + sname[0] + shortId.generate();
//   let screenName =
//     mname.length > 0
//       ? fname + "." + " " + mname[0] + "." + " " + sname[0]
//       : fname + "." + " " + sname[0];

//   let action = (cb) => {
//     marom_db(async (config) => {
//       const sql = require("mssql");
//       var poolConnection = await sql.connect(config);

//       let result = poolConnection
//         ? await get_action(poolConnection)
//         : "connection error";
//       cb(result);
//     });
//   };

//   action((result) => {
//     if (result) {
//       let db = marom_db(async (config) => {
//         const sql = require("mssql");
//         var poolConnection = await sql.connect(config);

//         insert_rates(poolConnection)
//           .then((result) => {
//             res.send({
//               user: UserId,
//               screen_name: screenName,
//               bool: true,
//               mssg: "Data Was Saved Successfully",
//               type: "save",
//             });
//           })
//           .catch((err) => {
//             res.send({
//               user: UserId,
//               screen_name: screenName,
//               bool: false,
//               mssg: "Data Was Not Saved Successfully Due To Database Malfunction, Please Try Again.",
//             });
//           });
//       });
//     } else {
//       let db = marom_db(async (config) => {
//         const sql = require("mssql");
//         var poolConnection = await sql.connect(config);

//         update_rates(poolConnection)
//           .then((result) => {
//             res.send({
//               user: UserId,
//               screen_name: screenName,
//               bool: true,
//               mssg: "Data Was Updated Successfully",
//               type: "update",
//             });
//           })
//           .catch((err) => {
//             res.send({
//               user: UserId,
//               screen_name: screenName,
//               bool: false,
//               mssg: "Data Was Not Updated Successfully Due To Database Malfunction, Please Try Again.",
//             });
//           });
//         //res.send({user: UserId, screen_name: screenName, bool: true, mssg: 'Data Was Updated Successfully'})
//       });
//     }
//   });

//   let get_action = async (poolConnection) => {
//     let records = await poolConnection
//       .request()
//       .query(
//         `SELECT * FROM "TutorSetup" WHERE CONVERT(VARCHAR, Email) = '${email}'`
//       );
//     let get_duplicate = await records.recordset;

//     let result = get_duplicate.length > 0 ? false : true;
//     return result;
//   };

//   let insert_rates = async (poolConnection) => {
//     const dataObject = {
//       Photo: photo || null,
//       Video: video || null,
//       FirstName: fname || null,
//       MiddleName: mname || null,
//       LastName: sname || null,
//       Address1: add1 || null,
//       Address2: add2 || null,
//       CityTown: city || null,
//       StateProvince: state || null,
//       ZipCode: zipCode || null,
//       Country: country || null,
//       Email: email || null,
//       CellPhone: cell || null,
//       GMT: timeZone || null,
//       ResponseHrs: response_zone || null,
//       TutorScreenname: screenName || null,
//       HeadLine: headline || null,
//       Introduction: intro || null,
//       Motivate: motivation || null,
//       IdVerified: null || null,
//       BackgroundVerified: null || null,
//       AcademyId: UserId || null,
//       Status: "Pending" || null,
//       Grades: grades || null,
//       userId,
//     };
//     let records = await poolConnection
//       .request()
//       .query(insert("TutorSetup", dataObject));

//     let result = (await records.rowsAffected[0]) === 1 ? true : false;
//     return result;
//   };

//   let update_rates = async (poolConnection) => {
//     let records = await poolConnection
//       .request()
//       .query(
//         `UPDATE "TutorSetup" set Photo = '${photo}', Video = '${video}',  Grades = '${grades}', Address1 = '${add1}', Address2 = '${add2}', CityTown = '${city}', StateProvince = '${state}', ZipCode = '${zipCode}', Country = '${country}', Email = '${email}', CellPhone = '${cell}', GMT = '${timeZone}', ResponseHrs = '${response_zone}', TutorScreenname = '${screenName}', HeadLine = '${headline}', Introduction = '${intro}', Motivate = '${motivation}', Password = '${pwd}', IdVerified = '${null}', BackgroundVerified = '${null}' WHERE CONVERT(VARCHAR, AcademyId) = '${acadId}'`
//       );

//     let result = (await records.rowsAffected[0]) === 1 ? true : false;
//     return result;
//   };
// };

const dynamically_post_edu_info = (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const request = poolConnection.request();
      Object.keys(req.body).map((column) => {
        request.input(column, educationSchema[column], req.body[column]);
      });

      const existEduRec = await request.query(
        findByAnyIdColumn(
          "Education1",
          { AcademyId: req.body.AcademyId },
          "varchar"
        )
      );
      if (existEduRec.recordset.length) {
        const update = await request.query(
          parameteriedUpdateQuery(
            "Education1",
            req.body,
            { AcademyId: req.body.AcademyId },
            false
          ).query
        );
        update.rowsAffected
          ? res.status(200).send({ message: "Updated Sucesfully" })
          : sendErrors({ message: "Failed to update the record" }, res);
      } else {
        const insert = await request.query(
          parameterizedInsertQuery("Education1", req.body).query
        );
        res.status(200).send(insert.recordset);
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

// const update_tutor_edu = (req, res) => {
//   marom_db(async (config) => {
//     try {
//       const poolConnection = await sql.connect(config);
//       const request = poolConnection.request();
//       Object.keys(req.body).map((column) => {
//         request.input(column, educationSchema[column], req.body[column]);
//       });

//      const {recordset} = await request.query()
//     } catch (err) {
//       sendErrors(err, res);
//     }
//   });
// };

let post_tutor_rates_form = (req, res) => {
  marom_db(async (config) => {
    try {
      var poolConnection = await sql.connect(config);
      const request = await poolConnection.request();
      Object.keys(req.body).map((key) =>
        request.input(key, Discounts[key], req.body[key])
      );

      const { recordset } = await request.query(
        parameterizedInsertQuery("Discounts", req.body).query
      );

      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let update_discount_form = (req, res) => {
  marom_db(async (config) => {
    try {
      var poolConnection = await sql.connect(config);
      const request = poolConnection.request();
      const { id } = req.params;
      Object.keys({ ...req.body, id }).map((key) =>
        request.input(key, Discounts[key], { ...req.body, id }[key])
      );
      const result = await request.query(
        parameteriedUpdateQuery("Discounts", req.body, req.params, {}, false)
          .query
      );

      res.status(200).send({ updated: result.rowsAffected[0] });
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

// let get_countries = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT Country FROM Countries
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_state = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM States
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_gmt = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM GMT
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_experience = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM Experience
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_level = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM EducationalLevel
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_degree = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM Degree
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_certificates = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM CertificateTypes
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

// let get_response = (req, res) => {
//   marom_db(async (config) => {
//     const sql = require("mssql");

//     var poolConnection = await sql.connect(config);
//     // console.log(poolConnection._connected)
//     if (poolConnection) {
//       var resultSet = await poolConnection.request().query(
//         `
//                     SELECT * FROM ResponseTime
//                 `
//       );

//       res.send(resultSet);
//     }
//   });
// };

let get_user_data = (req, res) => {
  let { user_id } = req.query;
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    // console.log(poolConnection._connected)
    if (poolConnection) {
      poolConnection
        .request()
        .query(
          `
                    SELECT EducationalLevel, EducationalLevelExperience, Certificate, CertificateState, 
                    CertificateExpiration, AcademyId  From Education1  WHERE CONVERT(VARCHAR(max), AcademyId) = 
                    '${user_id}'
                `
        )
        .then((result) => {
          res.status(200).send(result.recordset);
        });
      // .catch(err => console.log(err))
    }
  });
};

let upload_tutor_rates = (req, res) => {
  let { id, faculty, subject } = req.params;
  marom_db(async (config) => {
    try {
      const sql = require("mssql");

      var poolConnection = await sql.connect(config);
      if (poolConnection) {
        const existed = await poolConnection.request().query(
          find(
            "SubjectRates",
            {
              AcademyId: id,
              subject,
              faculty,
            },
            "AND",
            {
              AcademyId: "varchar",
              subject: "varchar",
              faculty: "varchar",
            }
          )
        );
        let result;
        if (existed.recordset.length) {
          result = await poolConnection.request().query(
            update(
              "SubjectRates",
              req.body,
              {
                AcademyId: id,
                subject,
                faculty,
              },
              {
                AcademyId: "varchar",
                subject: "varchar",
                faculty: "varchar",
              }
            )
          );
        } else {
          result = await poolConnection.request().query(
            insert("SubjectRates", {
              ...req.body,
              ...{
                AcademyId: id,
                subject: subject,
                faculty: faculty,
              },
            })
          );
        }
        res.status(200).send(result.recordset);
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

let remove_subject_rates = (req, res) => {
  let { id } = req.params;
  marom_db(async (config) => {
    try {
      const sql = require("mssql");

      var poolConnection = await sql.connect(config);
      if (poolConnection) {
        const deleted = await poolConnection
          .request()
          .query(`Delete FROM SubjectRates where SID = '${id}'`);
        console.log(deleted);

        res.status(200).send(deleted);
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

let upload_tutor_bank = (req, res) => {
  marom_db(async (config) => {
    let body = {
      AccountName: req.body.acct_name,
      AccountType: req.body.acct_type,
      BankName: req.body.bank_name,
      Account: req.body.acct,
      Routing: req.body.routing,
      SSH: req.body.ssh,
      PaymentOption: req.body.payment_option,
      AcademyId: req.body.AcademyId,
      Email: req.body.email,
    };
    try {
      const poolConnection = await sql.connect(config);
      const request = poolConnection.request();

      Object.keys(body).map((key) =>
        request.input(key, Accounting[key], body[key])
      );

      const { recordset } = await request.query(
        parameterizedInsertQuery("TutorBank", body).query
      );
      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let update_tutor_bank = (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const request = poolConnection.request();
      const { id } = req.params;

      Object.keys({ ...req.body, id }).map((key) =>
        request.input(key, Accounting[key], { ...req.body, id }[key])
      );
      const { rowsAffected } = await request.query(
        parameteriedUpdateQuery("TutorBank", req.body, req.params, {}, false)
          .query
      );
      res.status(200).send({ updated: rowsAffected[0] });
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let get_my_data = async (req, res) => {
  let { AcademyId } = req.query;
  let books = [];

  let response_0 = (resolve) => {
    marom_db(async (config) => {
      const sql = require("mssql");
      var poolConnection = await sql.connect(config);

      poolConnection
        .request()
        .query(
          `SELECT * from TutorSetup WHERE CONVERT(VARCHAR, AcademyId) = '${AcademyId}' `
        )
        .then((result) => {
          books.push(result.recordsets);
          resolve();
        })
        .catch((err) => err);
    });
  };

  let response_1 = (resolve) => {
    marom_db(async (config) => {
      const sql = require("mssql");
      var poolConnection = await sql.connect(config);

      poolConnection
        .request()
        .query(
          `SELECT * from Education1 WHERE CONVERT(VARCHAR, AcademyId) = '${AcademyId}' `
        )
        .then((result) => {
          books.push(result.recordsets);
          resolve();
        })
        .catch((err) => err);
    });
  };

  let response_2 = (cb) => {
    marom_db(async (config) => {
      const sql = require("mssql");
      var poolConnection = await sql.connect(config);

      poolConnection
        .request()
        .query(
          `SELECT * from Discounts WHERE CONVERT(VARCHAR, AcademyId) = '${AcademyId}' `
        )
        .then((result) => {
          books.push(result.recordsets);
          cb();
        })
        .catch((err) => err);
    });
  };

  let sender = (cb) => {
    new Promise((resolve) => {
      response_1(resolve);
    }).then(() => {
      response_2(cb);
    });
    // .catch(err => console.log(err))
  };

  sender(() => {
    new Promise((resolve) => {
      response_0(resolve);
    })

      // .catch(err => console.log(err))
      .finally(() => {
        res.send(books);
      });
  });
};

const get_faculty_subjects = async (req, res) => {
  marom_db(async (config) => {
    const { facultyId } = req.params;
    try {
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection.request().query(` SELECT 
    s.Id, s.SubjectName, s.FacultyId,
    COUNT(DISTINCT CAST(ts_filtered.AcademyId AS NVARCHAR(255))) AS tutor_count
    FROM 
        Subjects s
    LEFT JOIN 
        (
            SELECT 
                DISTINCT cast (sr.subject as varchar) as subject, ts.AcademyId as AcademyId
            FROM 
                SubjectRates sr
            LEFT JOIN 
                TutorSetup ts ON CAST(sr.AcademyId AS VARCHAR) = CAST(ts.AcademyId AS VARCHAR)
            WHERE 
                ts.Status = 'active' and cast(sr.faculty as varchar) = '${facultyId}'
        ) ts_filtered ON CAST(s.SubjectName AS VARCHAR) = CAST(ts_filtered.subject AS VARCHAR)
    WHERE 
        s.FacultyId = '${facultyId}'
    GROUP BY  
        s.Id, s.SubjectName, s.FacultyId; `);

      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let get_rates = (req, res) => {
  let { AcademyId, facultyId, subject } = req.query;
  marom_db(async (config) => {
    try {
      const sql = require("mssql");

      var poolConnection = await sql.connect(config);
      if (poolConnection) {
        const result = await poolConnection.request().query(
          `Select sb.SubjectName as subject, sb.FacultyId as facultyId,
                     sr.rate, sr.AcademyId, 
                    sr.grades as grades, sr.SID,
                    sb.CreatedOn FROM Subjects as sb
                    LEFT JOIN SubjectRates as sr ON  
                    cast(sr.subject  as varchar(max))=
                    cast( sb.SubjectName as varchar(max)) and 
                    cast( sr.faculty as varchar(max))= 
                      cast(sb.FacultyId as varchar(max)) and 
                      cast( sr.AcademyId  as varchar)= '${AcademyId}'
                    where sb.FacultyId = ${facultyId}
                `
        );
        res.status(200).send(result.recordset);
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

const get_tutor_offered_subjects = (req, res) => {
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(
          find("SubjectRates", { AcademyId: req.params.id }, "AND", {
            AcademyId: "varchar",
          })
        )
        .then((result) => {
          // const subjects = result.recordset.map((rates) => rates.subject);
          res.status(200).send(result.recordset);
        })
        .catch((err) => {
          sendErrors(err, res);
        });
    }
  });
};

let get_tutor_discount_form = (req, res) => {
  let { AcademyId } = req.query;
  marom_db(async (config) => {
    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(
          `  SELECT * From Discounts WHERE 
                    CONVERT(VARCHAR, AcademyId) = '${AcademyId}' 
                `
        )
        .then((result) => {
          res.status(200).send(result.recordset);
        })
        .catch((err) => console.log(err));
    }
  });
};

let faculties = (req, res) => {
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(`SELECT * From Faculty `)
        .then((result) => {
          res.status(200).send(result.recordset);
        })
        .catch((err) => sendErrors(err));
    }
  });
};

let get_bank_details = (req, res) => {
  let { AcademyId } = req.query;
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(
          `
                    SELECT * From TutorBank WHERE CONVERT(VARCHAR, AcademyId) = '${AcademyId}' 
                `
        )
        .then((result) => {
          res.status(200).send(result.recordset);
        });
      // .catch(err => console.log(err))
    }
  });
};

let get_tutor_setup = (req, res) => {
  marom_db(async (config) => {
    try {
      let poolConnection = await sql.connect(config);
      if (poolConnection) {
        const request = poolConnection.request();
        const result = await request.query(
          `SELECT
            Photo,
            FirstName,
            MiddleName,
            LastName,
            Address1,
            Address2,
            CityTown,
            StateProvince,
            ZipCode,
            Country,
            CellPhone,
            GMT,
            ResponseHrs,
            TutorScreenname,
            HeadLine,
            Introduction,
            Motivate,
            IdVerified,
            BackgroundVerified,
            AcademyId,
            Grades,
            userId,
            Online,
            AgreementDate,
            VacationMode,
            StartVacation,
            EndVacation,
            Step,
            Status,
            CreatedAT
      
          from TutorSetup where ${Object.keys(req.query)[0]} = '${
            req.query[Object.keys(req.query)[0]]
          }'`
        );
        let record = result.recordset?.[0] || {};
        if (record.userId) {
          const { recordset } = await request.query(
            findByAnyIdColumn("Users1", { SID: record.userId })
          );
          let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          record = { ...record, Email: recordset?.[0]?.email || "" };

          const match = record.GMT.match(/^([+-]\d{2})(?::(\d{2}))?$/);
          if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = match[2] ? parseInt(match[2], 10) : 0;

            const offset = hours * 60 + minutes;

            const timezones = moment.tz
              .names()
              .filter((name) => moment.tz(name).utcOffset() === offset);
            timeZone = timezones?.[0] || timeZone;
          }
          const formattedResult = [{ ...record, timeZone }];

          res.status(200).send(formattedResult);
        } else res.status(200).send({});
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let get_tutor_calender_details = (req, res) => {
  marom_db(async (config) => {
    try {
      var poolConnection = await sql.connect(config);
      if (poolConnection) {
        const request = poolConnection.request();
        const { recordset } = await request.query(
          `SELECT
            disableDates,
            disableWeekDays,
            enableHourSlots,
            disableHourSlots,
            enabledDays,
            addedDisabledHours,
            disableHoursRange,
            disableColor

          from TutorSetup where ${Object.keys(req.query)[0]} = '${
            req.query[Object.keys(req.query)[0]]
          }'`
        );
        res.status(200).send(recordset);
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_tutor_photos = async (req, res) => {
  marom_db(async (config) => {
    const sql = require("mssql");
    const { AcademyIds } = req.query;

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(
          `Select AcademyId, Photo as photo from TutorSetup where AcademyId IN (${AcademyIds.map(
            (id) => `'${id}'`
          )})`
        )
        .then((result) => {
          res.status(200).send(result.recordset);
        })
        .catch((err) => {
          console.log(err);
          sendErrors(err, res);
        });
    }
  });
};

let get_my_edu = (req, res) => {
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(findByAnyIdColumn("Education1", req.query, "varchar(max)"))
        .then((result) => {
          res.status(200).send(result.recordset);
        })
        .catch((err) => {
          console.log(err);
          sendErrors(err, res);
        });
    }
  });
};

//related to booking slot and student section
let storeEvents = (req, res) => {
  try {
    const { end, start, title } = req.body;

    marom_db(async (config) => {
      const sql = require("mssql");

      var poolConnection = await sql.connect(config);
      if (poolConnection) {
        poolConnection
          .request()
          .query(
            `
                   INSERT INTO EVENTS (endTime, startTime, title) VALUES ('${end}','${start}', '${title}')
                `
          )
          .then((result) => {
            res.status(200).send(result);
          })
          .catch((err) => console.log(err));
      }
    });
  } catch (error) {
    console.error("Error storing event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

let storeCalenderTutorRecord = (req, res) => {
  const { id } = req.params;
  try {
    marom_db(async (config) => {
      const sql = require("mssql");

      var poolConnection = await sql.connect(config);
      if (poolConnection) {
        poolConnection
          .request()
          .query(updateById(id, "TutorSetup", req.body))
          .then((result) => {
            res.status(200).send(result.rowsAffected);
          });
      }
    });
  } catch (error) {
    console.error("Error Updating TutorSetup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

let get_tutor_status = (req, res) => {
  let { AcademyId } = req.query;
  marom_db(async (config) => {
    const sql = require("mssql");

    var poolConnection = await sql.connect(config);
    if (poolConnection) {
      poolConnection
        .request()
        .query(
          `
                    SELECT Status From TutorSetup WHERE CONVERT(VARCHAR, AcademyId) = '${AcademyId}' 
                `
        )
        .then((result) => {
          res.status(200).send(result.recordset);
        });
      // .catch(err => console.log(err))
    }
  });
};

// let fetchStudentsBookings = (req, res) => {
//   try {
//     const { tutorId } = req.params;
//     marom_db(async (config) => {
//       const sql = require("mssql");

//       var poolConnection = await sql.connect(config);
//       if (poolConnection) {
//         poolConnection
//           .request()
//           .query(find("StudentBookings", { tutorId }))
//           .then((result) => {
//             res.status(200).send(result.recordset);
//           })
//           .catch((err) => {
//             sendErrors(err, res);
//           });
//       }
//     });
//   } catch (err) {
//     console.error("Error storing Events:", err);
//     sendErrors(err, res);
//   }
// };

let getAllTutorLesson = (req, res) => {
  try {
    const { tutorId } = req.query;
    marom_db(async (config) => {
      try {
        var poolConnection = await sql.connect(config);
        if (poolConnection) {
          const result = await poolConnection
            .request()
            .query(find("Lessons", { tutorId }));
          res.status(200).send(result.recordset);
        }
      } catch (err) {
        sendErrors(err, res);
      }
    });
  } catch (err) {
    sendErrors(err, res);
  }
};

const post_tutor_setup = (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);
      if (poolConnection) {
        const findtutorSetup = await poolConnection
          .request()
          .query(findByAnyIdColumn("TutorSetup", { userId: req.body.userId }));
        if (findtutorSetup.recordset.length) {
          delete req.body["AcademyId"];
          const request = poolConnection.request();
          request.input(
            "AcademyId",
            sql.NVarChar(sql.MAX),
            findtutorSetup.recordset[0].AcademyId
          );

          Object.keys(req.body).map((key) => {
            request.input(key, TutorSetup[key], req.body[key]);
          });

          const { query } = parameteriedUpdateQuery(
            "TutorSetup",
            req.body,
            {
              AcademyId: findtutorSetup.recordset[0].AcademyId,
            },
            {},
            false
          );
          const result = await request.query(query);

          if (result.rowsAffected[0]) {
            const result = await poolConnection.request().query(
              findByAnyIdColumn("TutorSetup", {
                AcademyId: findtutorSetup.recordset[0].AcademyId,
              })
            );
            res.status(200).send(result.recordset);
          } else res.status(200).send([]);
        } else {
          req.body.AcademyId =
            req.body.MiddleName.length > 0
              ? `${req.body.FirstName}.${req.body.MiddleName[0]}.${
                  req.body.LastName[0]
                }${shortId.generate()}`
              : `${req.body.FirstName}.${
                  req.body.LastName[0]
                }${shortId.generate()}`;

          const request = poolConnection.request();
          Object.keys(req.body).map((key) => {
            request.input(key, TutorSetup[key], req.body[key]);
          });

          const { query } = parameterizedInsertQuery("TutorSetup", req.body);
          const result = await request.query(query);

          res.status(200).send(result.recordset);
        }
      } else throw new Error("Facing trouble with Connection!");
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const update_tutor_setup = (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      if (poolConnection) {
        const request = poolConnection.request();
        Object.keys({ ...req.params, ...req.body }).map((key) => {
          request.input(
            key,
            TutorSetup[key],
            { ...req.params, ...req.body }[key]
          );
        });

        const result = await request.query(
          parameteriedUpdateQuery("TutorSetup", req.body, req.params, {}, false)
            .query
        );
        res
          .status(200)
          .send(
            result.rowsAffected.length
              ? { message: "updated!" }
              : { message: "No record Found!" }
          );
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const set_agreements_date_null_for_all = (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);
      if (poolConnection) {
        const result = await poolConnection
          .request()
          .query(`Update TutorSetup set AgreementDate = null`);
        res.status(200).send(result.rowsAffected ? true : false);
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let get_tutor_market_data = async (req, res) => {
  marom_db(async (config) => {
    try {
      let { id } = req.query;
      const poolConnection = await sql.connect(config);
      let Education = await poolConnection
        .request()
        .query(
          `SELECT * From Education1 WHERE CONVERT(VARCHAR, AcademyId) =  '${id}'`
        );

      let Subjects = await poolConnection
        .request()
        .query(
          `SELECT * FROM SubjectRates WHERE CONVERT(VARCHAR, AcademyId) =  '${id}'`
        );

      res.status(200).send({
        Education: Education.recordset,
        Subjects: Subjects.recordset,
      });
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let get_tutor_students = async (req, res) => {
  marom_db(async (config) => {
    try {
      const { academyId } = req.params;

      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection.request().query(`
            SELECT st.Photo as photo, 
            st.AcademyId,
            st.Online as online,
            st.ScreenName  as screenName,
            ls.subject,
            st.Country as country,
            st.GMT as gmt,
            st.Grade as grade,
            ls.rate as rate,
 
          SUM(ls.rate) AS totalNet,
          MIN(start) AS dateStart,
          MAX([end]) AS dateLast,
          count(*) as totalHours

            FROM StudentSetup1 as st
            join Lessons as ls
            on cast(ls.studentId as varchar) = cast(st.AcademyId  as varchar) 
            WHERE  CONVERT(VARCHAR, ls.tutorId) = '${academyId}'
            group by ls.subject, st.AcademyId,  
            st.Online,
            st.ScreenName,
            st.Country,
            st.GMT,
            st.Grade,
            ls.rate,
            st.Photo
           `);

      res.status(200).json(recordset);
    } catch (error) {
      sendErrors(error, res);
    }
  });
};

let getSessionsDetails = async (req, res) => {
  const { tutorId } = req.params;
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);

      if (poolConnection) {
        const { recordset } = await poolConnection.request().query(
          `SELECT ls.*, ch.ChatID as chatId
            FROM Lessons AS ls
            inner JOIN TutorSetup AS ts On
            ls.tutorId = CAST(ts.AcademyId AS varchar(max))
            left JOIN Chat AS ch ON
            ch.User1ID =cast( ls.studentId AS varchar) AND
            ch.User2ID =cast( ts.AcademyId AS varchar)
            WHERE ls.tutorId = CAST('${tutorId}' AS varchar(max));`
        );

        recordset.sort((a, b) => new Date(b.start) - new Date(a.start));

        const sessionWithCommision = recordset.map((session, index) => ({
          ...session,
          comm: commissionAccordingtoNumOfSession(recordset.length - index),
          sr: recordset.length - index,
          net: calcNet(
            session.rate,
            commissionAccordingtoNumOfSession(recordset.length - index)
          ),
        }));

        const today = moment(); // Get today's date
        let latestPayday = moment("2024-01-18T17:21:42.727Z", "YYYY-MM-DD");

        while (latestPayday.isBefore(today)) {
          latestPayday.add(14, "days");

          if (latestPayday.isAfter(today)) {
            latestPayday = moment(latestPayday).subtract(14, "days");
            break;
          }
        }

        const currentYear = moment().year();

        // Filter sessions for the current year
        const currentYearFullfilledSessions = sessionWithCommision.filter(
          (session) =>
            moment(session.start).year() === currentYear &&
            session.request !== "delete"
        );

        const previousYearFullFilledSessions = sessionWithCommision.filter(
          (session) =>
            moment(session.start).year() === currentYear - 1 &&
            session.request !== "delete"
        );
        const currentYearEarning = currentYearFullfilledSessions.reduce(
          (total, session) => total + session.net,
          0
        );
        const previousYearEarning = previousYearFullFilledSessions.reduce(
          (total, session) => total + session.net,
          0
        );
        const currentYearAccHours = currentYearFullfilledSessions.length;

        res.status(200).send({
          currentYearEarning,
          previousYearEarning,
          currentYearAccHours,
          sessions: sessionWithCommision,
        });
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

const get_all_tutor_sessions_formatted = async (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);
      if (poolConnection) {
        const { recordset } = await poolConnection.request().query(
          `select ls.*, TS.GMT
            from Lessons as ls
            join TutorSetup as TS on
            cast(TS.AcademyId as varchar) = ls.tutorId
            where ls.tutorId = '${req.params.tutorId}'`
        );

        if (recordset) {
          const offset = parseInt(recordset[0]?.GMT, 10);
          let timezones = moment.tz
            .names()
            .filter((name) => moment.tz(name).utcOffset() === offset * 60);
          const timeZone = timezones[0] || null;

          const currentTime = moment().tz(timeZone);

          let removedGMTLessons = recordset.map((record) => {
            delete record?.GMT;
            return record;
          });

          const sortedEvents = removedGMTLessons.sort((a, b) =>
            moment(a.start).diff(moment(b.start))
          );
          const upcomingSession =
            sortedEvents.find((event) =>
              moment(event.start).isAfter(currentTime)
            ) || {};

          const currentSession =
            sortedEvents.find((session) => {
              const startTime = moment(session.start);
              const endTime = moment(session.end);
              return currentTime.isBetween(startTime, endTime);
            }) || {};

          const timeUntilStart = upcomingSession.id
            ? moment(upcomingSession.start).tz(timeZone).to(currentTime, true)
            : "";
          let inMins = false;
          if (
            timeUntilStart.includes("minutes") ||
            timeUntilStart.includes("minute") ||
            timeUntilStart.includes("seconds")
          ) {
            inMins = true;
          }

          res.status(200).send({
            sessions: sortedEvents,
            currentSession,
            upcomingSession,
            inMins,
            upcomingSessionFromNow: timeUntilStart,
          });
        } else {
          res.status(200).send({
            sessions: [],
            currentSession: {},
            upcomingSession: {},
            inMins: false,
            upcomingSessionFromNow: "",
          });
        }
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

let last_pay_day = async (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);

      if (poolConnection) {
        const result = await poolConnection.request().query(
          `SELECT Top 1 *
                  FROM Plateform_Payments
                  ORDER BY payday DESC`
        );

        const today = moment(); // Get today's date
        let latestPayday = moment(result.recordset[0].Payday, "YYYY-MM-DD");

        while (latestPayday.isBefore(today)) {
          latestPayday.add(14, "days");

          if (latestPayday.isAfter(today)) {
            latestPayday = moment(latestPayday).subtract(14, "days");
            break;
          }
        }
        const formattedResult = {
          AdminId: result.recordset[0].AcademyId,
          Payday: latestPayday,
          SID: result.recordset[0].SID,
          Status: result.recordset[0].Status,
        };

        res.status(200).send(formattedResult);
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

// const get_tutor_profile_data = async (req, res) => {
//   marom_db(async (config) => {
//     try {
//       const sql = require("mssql");
//       const poolConnection = await sql.connect(config);

//       if (poolConnection) {
//         const result = await poolConnection.request().query(
//           `SELECT
//             CAST(ts.AcademyId AS VARCHAR(MAX)) AS AcademyId,
//             CAST(ts.TutorScreenname AS VARCHAR(MAX)) AS TutorScreenname,

//             CAST(ts.Video AS VARCHAR(MAX)) AS Video,
//             CAST(ts.Photo AS VARCHAR(MAX)) AS Photo,
//             CAST(ts.CellPhone AS VARCHAR(MAX)) AS CellPhone,
//             CAST(ts.CityTown AS VARCHAR(MAX)) AS CityTown,
//             CAST(ts.Country AS VARCHAR(MAX)) AS Country,
//             CAST(ts.FirstName AS VARCHAR(MAX)) AS FirstName,
//             CAST(ts.GMT AS VARCHAR(MAX)) AS GMT,
//             CAST(ts.Grades AS VARCHAR(MAX)) AS Grades,
//             CAST(ts.HeadLine AS VARCHAR(MAX)) AS HeadLine,
//             CAST(ts.Motivate AS VARCHAR(MAX)) AS Motivate,
//             CAST(ts.Introduction AS VARCHAR(MAX)) AS Introduction,
//             CAST(ts.Online AS VARCHAR(MAX)) AS Online,
//             CAST(ts.ResponseHrs AS VARCHAR(MAX)) AS ResponseHrs,
//             CAST(ts.StateProvince AS VARCHAR(MAX)) AS StateProvince,

//             CAST(te.WorkExperience AS VARCHAR(MAX)) As WorkExperience,
//             CAST(te.EducationalLevel AS VARCHAR(MAX)) as EducationalLevel,
//             CAST(te.EducationalLevelExperience AS VARCHAR(MAX)) EducationLevelExp,
//             CAST(te.BachCountry AS VARCHAR(MAX)) AS BachCountry,
//             CAST(te.Bach_College AS VARCHAR(MAX)) AS College1,
//             CAST(te.Bach_College_State AS VARCHAR(MAX)) AS College1State,
//             CAST(te.Bach_College_Year AS VARCHAR(MAX)) AS BachYear,
//             CAST(te.CertCountry AS VARCHAR(MAX)) AS CertCountry,
//             CAST(te.Certificate AS VARCHAR(MAX)) AS Certificate,
//             CAST(te.CertificateExpiration AS VARCHAR(MAX)) AS CertificateExpiration,
//             CAST(te.CertificateExpiration AS VARCHAR(MAX)) as CertExpDate,
//             CAST(te.DoctorateState AS VARCHAR(MAX)) as DocState,
//             CAST(te.DoctorateGradYr AS VARCHAR(MAX)) as DocYr,
//             CAST(te.DoctorateCollege AS VARCHAR(MAX)) as DocCollege,
//             CAST(te.DocCountry AS VARCHAR(MAX)) as DocCountry,
//             CAST(te.NativeLang AS VARCHAR(MAX)) as NativeLang,
//             CAST(te.NativeLangOtherLang AS VARCHAR(MAX)) as OtherLang,
//             CAST(te.Degree AS VARCHAR(MAX)) as Degree,
//             CAST(te.DegreeState AS VARCHAR(MAX)) as DegState,
//             CAST(te.DegreeYear AS VARCHAR(MAX)) as DegYr,
//             CAST(te.DegCountry AS VARCHAR(MAX)) as DegCountry,
//             CAST(te.MastCountry AS VARCHAR(MAX)) as MastCountry,
//             CAST(te.Mast_College AS VARCHAR(MAX)) as MastCollege,
//             CAST(te.Mast_College_State AS VARCHAR(MAX)) as MastState,
//             CAST(te.Mast_College_StateYear AS VARCHAR(MAX)) as MastYr,
//             CAST(te.Resume AS VARCHAR(MAX)) As Resume,
//             CAST(te.CertFileName AS VARCHAR(MAX)) As CertFileName,
//             CAST(te.DegFileName AS VARCHAR(MAX)) As DegFileName,

//             CAST(tc.ChatID AS VARCHAR(MAX)) AS ChatID,

//             CAST(tr.CancellationPolicy AS VARCHAR(MAX)) AS CancellationPolicy,
//             CAST(tr.IntroSessionDiscount AS VARCHAR(MAX))  AS IntroSessionDiscount,

//             ISNULL(
//                 (
//                     SELECT sr.subject AS Subject,
//                             sr.rate AS Rate, sr.Grades AS SubjectGrades
//                     FROM SubjectRates AS sr
//                     WHERE CAST(sr.AcademyId AS VARCHAR(MAX)) = CAST(ts.AcademyId AS VARCHAR(MAX))
//                     FOR JSON PATH
//                 ), '') AS Subjects
//         FROM
//             TutorSetup AS ts
//         LEFT JOIN
//             Education1 AS te ON CAST(ts.AcademyId AS VARCHAR(MAX)) = CAST(te.AcademyId AS VARCHAR(MAX))
//         LEFT JOIN
//             Chat AS tc ON CAST(ts.AcademyId AS VARCHAR) = tc.User2ID
//             AND CAST(tc.User1ID AS VARCHAR) = '${req.params.studentId}'
//         LEFT JOIN
//             Discounts AS tr ON CAST(tr.AcademyId AS VARCHAR) = ts.AcademyId

//         WHERE
//             CAST(ts.AcademyId AS VARCHAR(MAX)) = CAST('${req.params.tutorId}' AS VARCHAR(MAX))
//         GROUP BY
//             tc.ChatID,
//             CAST(ts.TutorScreenname AS VARCHAR(MAX)),

//             CAST(ts.AcademyId AS VARCHAR(MAX)),
//             CAST(ts.Photo AS VARCHAR(MAX)),
//             CAST(ts.Video AS VARCHAR(MAX)),
//             CAST(ts.CellPhone AS VARCHAR(MAX)),
//             CAST(ts.CityTown AS VARCHAR(MAX)),
//             CAST(ts.Country AS VARCHAR(MAX)),
//             CAST(ts.FirstName AS VARCHAR(MAX)),
//             CAST(ts.LastName AS VARCHAR(MAX)),
//             CAST(ts.GMT AS VARCHAR(MAX)),
//             CAST(ts.Grades AS VARCHAR(MAX)),
//             CAST(ts.HeadLine AS VARCHAR(MAX)),
//             CAST(ts.Motivate AS VARCHAR(MAX)),
//             CAST(ts.Introduction AS VARCHAR(MAX)),
//             CAST(ts.Online AS VARCHAR(MAX)),
//             CAST(ts.ResponseHrs AS VARCHAR(MAX)),
//             CAST(ts.StateProvince AS VARCHAR(MAX)),

//             CAST(te.WorkExperience AS VARCHAR(MAX)),
//             CAST(te.EducationalLevel AS VARCHAR(MAX)),
//             CAST(te.EducationalLevelExperience AS VARCHAR(MAX)),
//             CAST(te.BachCountry AS VARCHAR(MAX)),
//             CAST(te.Bach_College AS VARCHAR(MAX)),
//             CAST(te.Bach_College_State AS VARCHAR(MAX)),
//             CAST(te.Bach_College_Year AS VARCHAR(MAX)),
//             CAST(te.CertCountry AS VARCHAR(MAX)),
//             CAST(te.Certificate AS VARCHAR(MAX)),
//             CAST(te.CertificateExpiration AS VARCHAR(MAX)),
//             CAST(te.DoctorateState AS VARCHAR(MAX)),
//             CAST(te.DoctorateGradYr AS VARCHAR(MAX)),
//             CAST(te.DoctorateCollege AS VARCHAR(MAX)),
//             CAST(te.DocCountry AS VARCHAR(MAX)),
//             CAST(te.NativeLang AS VARCHAR(MAX)),
//             CAST(te.NativeLangOtherLang AS VARCHAR(MAX)),
//             CAST(te.Degree AS VARCHAR(MAX)),
//             CAST(te.DegreeState AS VARCHAR(MAX)),
//             CAST(te.DegreeYear AS VARCHAR(MAX)),
//             CAST(te.DegCountry AS VARCHAR(MAX)),
//             CAST(te.MastCountry AS VARCHAR(MAX)),
//             CAST(te.Mast_College AS VARCHAR(MAX)),
//             CAST(te.Mast_College_State AS VARCHAR(MAX)),
//             CAST(te.Mast_College_StateYear AS VARCHAR(MAX)),
//             CAST(te.Resume AS VARCHAR(MAX)) ,
//             CAST(te.CertFileName AS VARCHAR(MAX)),
//             CAST(te.DegFileName AS VARCHAR(MAX)) ,

//             CAST(tr.IntroSessionDiscount AS VARCHAR(MAX)),
//             CAST(tr.CancellationPolicy AS VARCHAR(MAX))
//           `
//         );
//         const record = result.recordset[0] || null;
//         if (!record) return res.status(200).send({});
//         const formattedResult = {
//           ...record,
//           Subjects: JSON.parse(record.Subjects.length ? record.Subjects : "[]"),
//           OtherLang: JSON.parse(record.OtherLang ?? "[]"),
//           NativeLang: JSON.parse(record.NativeLang ?? "[]"),
//         };
//         res.status(200).send(formattedResult);
//       }
//     } catch (err) {
//       console.log(err);
//       sendErrors(err, res);
//     }
//   });
// };

const post_tutor_ad = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const result = await poolConnection
        .request()
        .query(insert("TutorAds", req.body));
      res.status(200).send(result.recordset[0]);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_tutor_ads = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection
        .request()
        .query(find("TutorAds", req.params));
      recordset.sort(
        (a, b) => new Date(b.Published_At) - new Date(a.Published_At)
      );
      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_ad = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const result = await poolConnection
        .request()
        .query(findByAnyIdColumn("TutorAds", req.params));
      res.status(200).send(result.recordset[0]);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const put_ad = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const request = poolConnection.request();
      request.input("AcademyId", sql.NVarChar(sql.MAX), req.body.AcademyId);
      request.input("AdText", sql.NVarChar(sql.MAX), req.body.AdText);
      request.input("Subject", sql.NVarChar(sql.MAX), req.body.Subject);
      request.input("Certificate", sql.NVarChar(sql.MAX), req.body.Certificate);
      request.input("Experience", sql.NVarChar(sql.MAX), req.body.Experience);
      request.input("GMT", sql.NVarChar(sql.MAX), req.body.GMT);
      request.input("Country", sql.NVarChar(sql.MAX), req.body.Country);
      request.input(
        "EducationalLevel",
        sql.NVarChar(sql.MAX),
        req.body.EducationalLevel
      );
      request.input("Languages", sql.NVarChar(sql.MAX), req.body.Languages);
      request.input("Grades", sql.NVarChar(sql.MAX), req.body.Grades);
      request.input("Status", sql.NVarChar(sql.MAX), req.body.Status);
      request.input("Published_At", sql.DateTime(), req.body.Published_At);

      request.input("AdHeader", sql.NVarChar(sql.MAX), req.body.AdHeader);
      request.input("Id", sql.Int(), req.params.Id);

      const result = await request.query(
        parameteriedUpdateQuery("TutorAds", req.body, req.params, {}, false)
          .query
      );

      res.status(200).send(result.recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_tutor_against_code = async (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);
      if (poolConnection) {
        const result = await poolConnection
          .request()
          .query(
            findByAnyIdColumn("Discounts", { DiscountCode: req.params.code })
          );

        result.recordset.length
          ? res.status(200).send(result.recordset[0])
          : sendErrors({ message: "Code Does not Exist!" }, res);
      }
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

// const get_feedback_data = async (req, res) => {
//   marom_db(async (config) => {
//     try {
//       const { tutorId } = req.query;
//       const { timeZone } = req.query;
//       const poolConnection = await sql.connect(config);
//       const result = await poolConnection.request().query(`
//             SELECT *
//              FROM Lessons AS LS
//              WHERE LS.tutorId = CAST('${tutorId}' as varchar(max));`);

//       let sessions = [];

//       result.recordset.map((record) => {
//         const reservedSlots = JSON.parse(record.reservedSlots);
//         const bookedSlots = JSON.parse(record.bookedSlots);

//         sessions.push(reservedSlots.concat(bookedSlots));
//       });

//       const allSessions = sessions.flat();
//       const sessionsWithPhotos = allSessions.map((session) => {
//         const studentFound = result.recordset.find(
//           (record) => record.studentId === session.studentId
//         );
//         const currentTimeInTimeZone = moment().tz(timeZone);

//         const sessionEndInTimeZone = moment(session.end).tz(timeZone);
//         const minutesDifference = sessionEndInTimeZone.diff(
//           currentTimeInTimeZone,
//           "minutes"
//         );

//         if (minutesDifference <= 10) {
//           session = {
//             ...session,
//             tutorFeedbackEligible: true,
//           };
//         }
//         if (studentFound) {
//           return { ...session, photo: studentFound.Photo };
//         }
//         return session;
//       });
//       res.status(200).send(sessionsWithPhotos);
//     } catch (err) {
//       sendErrors(err, res);
//     }
//   });
// };

const get_tutor_feedback_questions = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection
        .request()
        .query(find("FeedbackQuestions", { ForStudents: 0 }));
      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const delete_ad = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection
        .request()
        .query(`Delete from TutorAds where Id = ${req.params.Id}`);
      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_student_published_ads = async (req, res) => {
  marom_db(async (config) => {
    try {
      const sql = require("mssql");
      const poolConnection = await sql.connect(config);
      if (poolConnection) {
        const { recordset } = await poolConnection.request().query(
          `select SA.*, SS.Photo from StudentAds as SA join
                  StudentSetup1 as SS on cast(SS.AcademyId as varchar) = SA.AcademyId
                  where  SA.Published_At is not null   `
        );
        // SS.Status = 'active' and
        recordset.sort(
          (a, b) => new Date(b.Published_At) - new Date(a.Published_At)
        );

        res.status(200).send(recordset);
      }
    } catch (err) {
      console.log(err);
      sendErrors(err, res);
    }
  });
};

const delete_ad_from_shortlist = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const data = await poolConnection.request().query(
        `delete from TutorShortlistAd where TutorId = '${req.params.tutorId}' and 
                StudentAdId = ${req.params.Id}`
      );
      res.status(200).send(data);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const ad_to_shortlist = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection
        .request()
        .query(find("TutorShortlistAd", req.body));
      if (!recordset.length) {
        const { recordset } = await poolConnection
          .request()
          .query(insert("TutorShortlistAd", req.body));
        res.status(200).send(recordset);
      }
      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_shortlist_ads = async (req, res) => {
  marom_db(async (config) => {
    try {
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection.request().query(
        `select SA.*, SS.Photo 
                from 
                TutorShortlistAd as TSA join 
                StudentAds as SA on
                SA.Id = TSA.StudentAdId join
                StudentSetup1 as SS on 
                cast(SS.AcademyId as varchar) = SA.AcademyId
                where TSA.TutorId = '${req.params.tutorId}'`
      );
      recordset.sort(
        (a, b) => new Date(b.Published_At) - new Date(a.Published_At)
      );

      res.status(200).send(recordset);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const get_student_public_profile_data = async (req, res) => {
  marom_db(async (config) => {
    try {
      const { studentId, tutorId } = req.params;
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection.request().query(
        `SELECT SS.*, ch.ChatID From 
                StudentSetup1 as SS 
                left join Chat as ch on
                ch.User1ID = cast(SS.AcademyId as varchar)
                where cast(SS.AcademyId as varchar) = '${studentId}' and ch.User2ID = '${tutorId}'`
      );

      res.status(200).send(recordset[0]);
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

const recordVideoController = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!req.file || !req.file.mimetype.startsWith("video/")) {
      return sendErrors({ message: "Please upload a video file" }, res);
    }

    if (!user_id) {
      return sendErrors({ message: "Please provide a user id" }, res);
    }

    // Mirror the video horizontally using ffmpeg
    const outputFileName = `interviews/${user_id}.mp4`;
    const command = `ffmpeg -y -i ${req.file.path} -vf "hflip" ${outputFileName}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        return res.status(500).send({
          message: "Failed to upload the video. The video may be corrupted.",
          reason: error.message,
        });
      }

      //delete the non-flipped video
      // TODO: del for windows (this is only for test) typical prod servers won't run on windows but linux
      // const del_command = `rm ${req.file.path}` //for mac and linux
      const del_command = `${process.env.NODE_ENV==="production"? 'rm' : 'del'} ${req.file.path}`;
      exec(del_command, async (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return res.status(500).send({ reason: error.message });
        }

        const blobClient = containerClient.getBlockBlobClient(`${user_id}.mp4`);
        const url = await blobClient.uploadFile(outputFileName);
        const folderPath = path.join(__dirname, "../interviews");
        await deleteFolder(folderPath);
        res.send({ message: "Video flipped successfully", url });
      });
    });
  } catch (err) {
    sendErrors(err, res);
  }
};

const getVideo = async (req, res) => {
  try {
    const { user_id } = req.query;
    const blobClient = containerClient.getBlockBlobClient(`${user_id}.mp4`);
    res.status(200).send({ url: blobClient.url });
  } catch (err) {
    sendErrors(err, res);
  }
};

const getSessionDetailById = async (req, res) => {
  marom_db(async (config) => {
    try {
      const { sessionId } = req.params;
      const { timezone } = req.query;
      const poolConnection = await sql.connect(config);
      const { recordset } = await poolConnection.request().query(`
                SELECT *
                FROM Lessons
                WHERE id = '${sessionId}'`);

      const sessionTime = sessionId
        ? checkSessionStatus(recordset[0], timezone)
        : "";

      res.status(200).send({ session: recordset[0], time: sessionTime });
    } catch (err) {
      sendErrors(err, res);
    }
  });
};

module.exports = {
  recordVideoController,
  getVideo,
  // get_tutor_profile_data,
  get_tutor_against_code,
  get_tutor_calender_details,
  delete_ad,
  update_tutor_bank,
  get_tutor_offered_subjects,
  // fetchStudentsBookings,
  getSessionDetailById,
  getSessionsDetails,
  // get_feedback_data,
  post_tutor_ad,
  update_tutor_setup,
  set_agreements_date_null_for_all,
  get_ad,
  get_student_published_ads,
  put_ad,
  get_tutor_feedback_questions,
  get_all_tutor_sessions_formatted,
  get_tutor_ads,
  dynamically_post_edu_info,
  remove_subject_rates,
  subject_already_exist,
  update_discount_form,
  last_pay_day,
  ad_to_shortlist,
  subjects,
  get_tutor_market_data,
  get_student_public_profile_data,
  get_tutor_students,
  post_tutor_setup,
  faculties,
  // post_form_one,
  post_tutor_rates_form,
  // get_countries,
  // get_gmt,
  post_new_subject,
  // get_state,
  get_shortlist_ads,
  // get_experience,
  // get_degree,
  // get_level,
  // get_certificates,
  delete_ad_from_shortlist,
  get_user_data,
  // get_response,
  upload_tutor_rates,
  get_my_data,
  get_my_edu,
  get_rates,
  upload_tutor_bank,
  get_tutor_setup,
  get_tutor_discount_form,
  get_bank_details,
  storeEvents,
  storeCalenderTutorRecord,
  get_tutor_status,
  getAllTutorLesson,
  get_faculty_subjects,
  get_tutor_photos,
};
