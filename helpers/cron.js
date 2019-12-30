'use strict';
const Config = require('../config/config');
const GlobalConfig = require('../config/gconfig');
const cron = require('node-cron');
const mysql = require('mysql');
const _ = require('underscore-node');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Leave = mongoose.model('Leave');
const Attendance = mongoose.model('Attendance');
const Holidays = mongoose.model('Holidays');

var connection = mysql.createConnection({
    host     : Config.mysql.host,
    user     : Config.mysql.username,
    password : Config.mysql.password,
    database: Config.mysql.database,
    timezone: Config.mysql.timezone
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Mysql Connected!");
});

exports.getDayDetail = async (req, callback) => {
    if( !req.params.userId ) return callback({"error": "userId missing"});
    if( !req.params.date ) return callback({"error": "date is missing"});
    var user = await User.findOne({userId: req.params.userId}).exec();
    if( !user ) return callback({"error": "Invalid userId"});
    var i = parseInt(req.params.date);
    var dt = new Date('2019-01-'+(i<10?('0'+i):i));
    var mm = (dt.getMonth()+1);
    var dd = dt.getDate();
    var startDate = dt.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = dt.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    var table = 'DeviceLogs_'+mm+'_'+dt.getFullYear();
    var m = (dt.getMonth()+1);
    var d = dt.getDate();
    var y = dt.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T00:00:00.000Z';
    var t = dt.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T23:59:59.000Z';
    var query = "SELECT * FROM "+table+" WHERE UserId="+user.userId+" AND (LogDate BETWEEN '"+y+"'"+" AND '"+t+"')";
    //console.log(query);
    connection.query(query, async (err, rows) => {
        if(err) throw err;
        var dd1 = rows[0].LogDate.toISOString().substring(8,10);
        var dd2 = rows[rows.length-1].LogDate.toISOString().substring(8,10);
        var tt = (dd2-dd1)>0?24:0;
        var inTm = rows[0].LogDate.toISOString().substring(11,16);
        var outTm = rows[rows.length-1].LogDate.toISOString().substring(11,16);
        var inTime = getTime(0, inTm);
        var outTime = getTime(tt, outTm);
        var rs = {
            data: rows,
            times: {
                in: inTime,
                out: outTime
            }
        }
        callback(rs);
    });
};

exports.getData = (filter, callback) => {
    var table = 'DeviceLogs_'+filter.month+'_'+filter.year;
    var m = (filter.date.getMonth()+1);
    var d = filter.date.getDate();
    var y = filter.date.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T00:00:00.000Z';
    var t = filter.date.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T23:59:59.000Z';
    var query = "SELECT * FROM "+table+" WHERE LogDate BETWEEN '"+y+"'"+" AND '"+t+"'";
    //console.log(query);
    connection.query(query, (err, rows) => {
      if(err) throw err;

      console.log('Data received from Db:\n');
      //console.log(rows);
      const results = _.groupBy(rows, 'UserId');
      // var string=JSON.stringify(results);
      //   var json =  JSON.parse(string);
      //   json.forEach(function(user) {
      //       console.log(user)
      //   });
      // for(var i=0; i<json.length; i++ ){
      //    console.log(json[0])
      // }
      callback(results[24]);
    });
};

exports.updateHolidayAttendance = async (req, callback) => {
    if( !req.params.userId ) return callback({"error": "userId missing"});
    if( !req.params.date ) return callback({"error": "date is missing"});
    var user = await User.findOne({userId: req.params.userId}).exec();
    if( !user ) return callback({"error": "Invalid userId"});
    var i = parseInt(req.params.date);
    var dt = new Date('2019-02-'+(i<10?('0'+i):i));
    var m = dt.getMonth()+1;
    var d = dt.getDate();
    var holidays = await Holidays.findOne({year: dt.getFullYear()}).exec();
    var isHoliday = false;
    var y = dt.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T00:00:00.000Z';
    var t = dt.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T23:59:59.000Z';
    for(var a=0; a<holidays.holidays.length; a++) {
        if(y.split('T')[0] == holidays.holidays[a].date.split('T')[0]) {
            isHoliday = true;
        }
    }
    if(isHoliday) {
        await Attendance.findOne({month: m, year: dt.getFullYear(), userId: user.userId, date: {
            $gte:  y,
            $lt:  t
        }}, function(err, record) {
            if(record) {
                record.mode = 'holiday';
                record.leaveType = 'W';
                record.isPaid = true;
                record.isApproved = true;
                record.save(function(err, rcrd) {
                    callback({"message": "data not found in Bio and Holiday Attendance updated for "+ user.userId + " at "+dt});
                });
            }
        });
    } else {
        callback({"message": "There is no Holiday for this date "+ i +" updated for "+ user.userId + " at "+dt});
    }
};

exports.updateAttendance = async (req, callback) => {
    if( !req.params.userId ) return callback({"error": "userId missing"});
    if( !req.params.date ) return callback({"error": "date is missing"});
    var user = await User.findOne({userId: req.params.userId}).exec();
    if( !user ) return callback({"error": "Invalid userId"});
    var i = parseInt(req.params.date);
    var dt = new Date('2019-02-'+(i<10?('0'+i):i));
    var mm = (dt.getMonth()+1);
    var dd = dt.getDate();
    var startDate = dt.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = dt.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    var table = 'DeviceLogs_'+mm+'_'+dt.getFullYear();
    var m = (dt.getMonth()+1);
    var d = dt.getDate();
    var y = dt.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T00:00:00.000Z';
    var t = dt.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T23:59:59.000Z';
    var query = "SELECT * FROM "+table+" WHERE UserId="+user.userId+" AND (LogDate BETWEEN '"+y+"'"+" AND '"+t+"')";
    //console.log(query);
    connection.query(query, async (err, rows) => {
      if(err) throw err;

      if(rows.length) {
          await Attendance.findOne({month: mm, year: dt.getFullYear(), userId: user.userId, date: {
              $gte:  y,
              $lt:  t
          }}, function(err, record) {
              if(record) {
                  var inTm = rows[0].LogDate.toISOString().substring(11,16);
                  var outTm = rows[rows.length-1].LogDate.toISOString().substring(11,16);
                  var dd1 = rows[0].LogDate.toISOString().substring(8,10);
                  var dd2 = rows[rows.length-1].LogDate.toISOString().substring(8,10);
                  var tt = (dd2-dd1)>0?24:0;
                  var inTime = getTime(0, inTm);
                  var outTime = getTime(tt, outTm);
                  record.arrivalTime = inTime;
                  record.leavingTime = outTime;
                  var tm1 = inTime;
                  var tm2 = outTime;

                  var d = dt.getDay();
                  var mode = (d>0&&d<6)?'on':'off';
                  if(tm1===tm2) {
                      record.leaveType = 'FD';
                      record.isPaid = false;
                      record.isApproved = false;
                  } else {
                      var t1 = tm1.split(':');
                      var t11 = parseInt(t1[0])*60+parseInt(t1[1]);
                      var t2 = tm2.split(':');
                      var t21 = parseInt(t2[0])*60+parseInt(t2[1]);
                      var mins = t21-t11;
                      var lType;
                      if (mins>470) {
                          lType = 'W';
                      } else if (mins<=470 && mins >420) {
                          lType = 'SL';
                      } else if (mins>=240 && mins <420) {
                          lType = 'HD';
                      } else {
                          lType = 'FD';
                      }
                      record.leaveType = lType;
                      if(lType=='W') {
                          record.isPaid = true;
                          record.isApproved = true;
                      } else {
                          record.isPaid = false;
                          record.isApproved = false;
                      }
                  }
                  record.save(function(err, rcrd) {
                      callback({"message": "Attendance updated for "+ user.userId + " at "+dt});
                  });
              } else {
                  callback({"message": "Attendance record not found for "+ user.userId + " at "+dt});
              }
          });
      } else {
          await Attendance.findOne({month: mm, year: dt.getFullYear(), userId: user.userId, date: {
              $gte:  y,
              $lt:  t
          }}, async function(err, record) {
              if(record) {
                  var d = dt.getDay();
                  var mode = (d>0&&d<6)?'on':'off';
                  if( (mode=='on') && (record.arrivalTime==record.leavingTime) ) {
                      record.leaveType = 'FD';
                      record.isPaid = false;
                      record.isApproved = false;
                  } else {
                      record.leaveType = 'W';
                      record.isPaid = true;
                      record.isApproved = true;
                  }
                  record.save(function(err, rcrd) {
                      callback({"message": "data not found in Bio and Attendance updated for "+ user.userId + " at "+dt});
                  });
              } else {
                  callback({"message": "data not found in Bio and Attendance record not found for "+ user.userId + " at "+dt});
              }
          });
      }
  });
};

exports.createAttendanceData = async (req, callback) => {
    if( !req.params.userId ) return callback({"error": "userId missing"});
    if( !req.params.date ) return callback({"error": "date is missing"});
    var user = await User.findOne({userId: req.params.userId}).exec();
    if( !user ) return callback({"error": "Invalid userId"});
    var i = parseInt(req.params.date);
    var dt = new Date('2019-02-'+(i<10?('0'+i):i));
    var mm = (dt.getMonth()+1);
    var dd = dt.getDate();
    var startDate = dt.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = dt.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';
    var holidays = await Holidays.findOne({year: dt.getFullYear()}).exec();
    var isHoliday = false;
    for(var a=0; a<holidays.holidays.length; a++) {
        if(startDate.split('T')[0] == holidays.holidays[a].date.split('T')[0]) {
            isHoliday = true;
        }
    }
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = dt.getDay();
    var dayName = days[d];
    var mode = (d>0&&d<6)?'on':'off';
    var isPaid = (d>0&&d<6)?false:true;
    var isApproved = (d>0&&d<6)?false:true;
    if(isHoliday) {
        mode = 'holiday';
        isPaid = true;
        isApproved = true;
    }
    var attendance = new Attendance({
        user: user._id,
        userId: user.userId,
        year: dt.getFullYear(),
        month: mm,
        day: dayName,
        mode: mode,
        isPaid: isPaid,
        isApproved: isApproved,
        date: startDate
    });
    await Attendance.findOne({
        user: user._id,
        userId: user.userId,
        year: dt.getFullYear(),
        month: mm,
        date: {
            $gte:  startDate,
            $lt:  endDate
        }
    }, function(err, attexist) {
        if( !attexist ) {
            attendance.save(function(err, atten) {
                if(err)
                console.log("Error in save for "+ user.userId + " at "+dt, err);

                callback({"message": "Saved attendance for "+ user.userId +" at "+dt});
            });
        } else {
            callback({"message": "Already attendance exist for "+ user.userId +" at "+dt});
        }
    });
};

function getTime(t, tm1) {
    var tm2 = Config.mysql.diffTime;
    var t1 = tm1.split(':');
    var t11 = (t+parseInt(t1[0]))*60+parseInt(t1[1]);

    var t2 = tm2.split(':');
    var t21 = parseInt(t2[0])*60+parseInt(t2[1]);
    var mins;
    if(Config.mysql.upDown == '-') {
        mins = t11-t21;
    } else {
        mins = t11+t21;
    }
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return h+':'+m;
}

//Running a task Every 5 minutes to update the Attendance between 8:00 AM to 10:00PM From Monday to Friday
cron.schedule('0 */5 * * * *', () => {
    //console.log("Sheet updated every 5 minutes", new Date().toISOString())
    var date = new Date();
    var yesterday = new Date(Date.now()-1*24*60*60*1000);
    var tomorrow = new Date(Date.now()+1*24*60*60*1000);
    var filter = {
        date: date,
        yesterday: yesterday,
        tomorrow: tomorrow,
        month: date.getMonth() + 1,
        year: date.getFullYear()
    };  
    var table = 'DeviceLogs_'+filter.month+'_'+filter.year;
    var m = (filter.date.getMonth()+1);
    var d = filter.date.getDate();
    var y = filter.date.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T00:00:00.000Z';
    var t = filter.date.getFullYear()+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d)+'T23:59:59.000Z';
    var query = "SELECT * FROM "+table+" WHERE LogDate BETWEEN '"+y+"'"+" AND '"+t+"'";
    //console.log(query);
    connection.query(query, (err, rows) => {
        if(err) throw err;
        //console.log('Data received from Db:\n');
        const results = _.groupBy(rows, 'UserId');
        Attendance.find({month: filter.month, year: filter.year, date: {
            $gte:  y,
            $lt:  t
        }}, function(err, records) {
            for(var i=0; i<records.length; i++) {
                if(results[records[i].userId]) {
                    var inTm = results[records[i].userId][0].LogDate.toISOString().substring(11,16);
                    var outTm = results[records[i].userId][results[records[i].userId].length-1].LogDate.toISOString().substring(11,16);
                    var dd1 = results[records[i].userId][0].LogDate.toISOString().substring(8,10);
                    var dd2 = results[records[i].userId][results[records[i].userId].length-1].LogDate.toISOString().substring(8,10);
                    var tt = (dd2-dd1)>0?24:0;
                    var inTime = getTime(0, inTm);
                    var outTime = getTime(tt, outTm);
                    records[i].arrivalTime = inTime;
                    records[i].leavingTime = outTime;
                    //console.log("Going to update attendance ", records[i]);
                    records[i].save(function(err, rcrd) { });
                }
            }
        });
    });
    console.log('Task running at each 10 minutes');
});

//Running a task 8:00 AM Every Day
cron.schedule('30 2 * * *', async () => {
    var date = new Date();
    var yesterday = new Date(Date.now()-1*24*60*60*1000);
    var tomorrow = new Date(Date.now()+1*24*60*60*1000);
    var filter = {
        date: date,
        yesterday: yesterday,
        tomorrow: tomorrow,
        month: date.getMonth() + 1,
        year: date.getFullYear()
    }; 
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = date.getDay();;
    var dayName = days[d];
    var mode = (d>0&&d<6)?'on':'off';
    var isPaid = (d>0&&d<6)?false:true;
    var isApproved = (d>0&&d<6)?false:true;
    var users = await User.find({userId: { $ne: 0}}).exec();
    var mm = (filter.date.getMonth()+1);
    var dd = filter.date.getDate();
    var startDate = filter.date.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = filter.date.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';

    var holidays = await Holidays.findOne({year: filter.date.getFullYear()}).exec();
    var isHoliday = false;
    for(var a=0; a<holidays.holidays.length; a++) {
        if(startDate.split('T')[0] == holidays.holidays[a].date.split('T')[0]) {
            isHoliday = true;
        }
    }
    if(isHoliday) {
        mode = 'holiday';
        isPaid = true;
        isApproved = true;
    }

    for(var i=0; i<users.length; i++) {
        var attendance = new Attendance({
            user: users[i]._id,
            userId: users[i].userId,
            year: filter.year,
            month: filter.month,
            day: dayName,
            mode: mode,
            isPaid: isPaid,
            isApproved: isApproved,
            date: startDate
        });
        await Attendance.findOne({
            user: users[i]._id,
            userId: users[i].userId,
            year: filter.year,
            month: filter.month,
            date: {
                $gte:  startDate,
                $lt:  endDate
            }
        }, function(err, user) {
            if( !user ) {
                attendance.save(function(err, atten) {
                    //console.log("Error in save", err);
                });
            }
        });
    }
    console.log('Running a task 8:00 AM Every Day');
});

//Running a task 8:10 AM Every Day
cron.schedule('40 2 * * *', async () => {
    var date = new Date();
    var yesterday = new Date(Date.now()-1*24*60*60*1000);
    var tomorrow = new Date(Date.now()+1*24*60*60*1000);
    var filter = {
        date: date,
        yesterday: yesterday,
        tomorrow: tomorrow,
        month: date.getMonth() + 1,
        year: date.getFullYear()
    }; 
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = date.getDay();;
    var dayName = days[d];
    var mode = (d>0&&d<6)?'on':'off';
    var isPaid = (d>0&&d<6)?false:true;
    var isApproved = (d>0&&d<6)?false:true;
    var users = await User.find({userId: { $ne: 0}}).exec();
    var mm = (filter.date.getMonth()+1);
    var dd = filter.date.getDate();
    var startDate = filter.date.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = filter.date.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';

    var holidays = await Holidays.findOne({year: filter.date.getFullYear()}).exec();
    var isHoliday = false;
    for(var a=0; a<holidays.holidays.length; a++) {
        if(startDate.split('T')[0] == holidays.holidays[a].date.split('T')[0]) {
            isHoliday = true;
        }
    }
    if(isHoliday) {
        mode = 'holiday';
        isPaid = true;
        isApproved = true;
    }

    for(var i=0; i<users.length; i++) {
        var attendance = new Attendance({
            user: users[i]._id,
            userId: users[i].userId,
            year: filter.year,
            month: filter.month,
            day: dayName,
            mode: mode,
            isPaid: isPaid,
            isApproved: isApproved,
            date: startDate
        });
        await Attendance.findOne({
            user: users[i]._id,
            userId: users[i].userId,
            year: filter.year,
            month: filter.month,
            date: {
                $gte:  startDate,
                $lt:  endDate
            }
        }, function(err, user) {
            if( !user ) {
                attendance.save(function(err, atten) {
                    //console.log("Error in save", err);
                });
            }
        });
    }
    console.log('Running a task 8:10 AM Every Day');
});

//Running a task 8:20 AM Every Day
cron.schedule('50 2 * * *', async () => {
    var date = new Date();
    var yesterday = new Date(Date.now()-1*24*60*60*1000);
    var tomorrow = new Date(Date.now()+1*24*60*60*1000);
    var filter = {
        date: date,
        yesterday: yesterday,
        tomorrow: tomorrow,
        month: date.getMonth() + 1,
        year: date.getFullYear()
    }; 
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = date.getDay();;
    var dayName = days[d];
    var mode = (d>0&&d<6)?'on':'off';
    var isPaid = (d>0&&d<6)?false:true;
    var isApproved = (d>0&&d<6)?false:true;
    var users = await User.find({userId: { $ne: 0}}).exec();
    var mm = (filter.date.getMonth()+1);
    var dd = filter.date.getDate();
    var startDate = filter.date.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = filter.date.getFullYear()+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';

    var holidays = await Holidays.findOne({year: filter.date.getFullYear()}).exec();
    var isHoliday = false;
    for(var a=0; a<holidays.holidays.length; a++) {
        if(startDate.split('T')[0] == holidays.holidays[a].date.split('T')[0]) {
            isHoliday = true;
        }
    }
    if(isHoliday) {
        mode = 'holiday';
        isPaid = true;
        isApproved = true;
    }

    for(var i=0; i<users.length; i++) {
        var attendance = new Attendance({
            user: users[i]._id,
            userId: users[i].userId,
            year: filter.year,
            month: filter.month,
            day: dayName,
            mode: mode,
            isPaid: isPaid,
            isApproved: isApproved,
            date: startDate
        });
        await Attendance.findOne({
            user: users[i]._id,
            userId: users[i].userId,
            year: filter.year,
            month: filter.month,
            date: {
                $gte:  startDate,
                $lt:  endDate
            }
        }, function(err, user) {
            if( !user ) {
                attendance.save(function(err, atten) {
                    //console.log("Error in save", err);
                });
            }
        });
    }
    console.log('Running a task 8:20 AM Every Day');
});

//Running a task 10:00 PM == 16:30 of server Every Day
cron.schedule('30 16 * * *', async () => {
    var date = new Date();
    var dd = date.getDate();
    var mm = (date.getMonth()+1);
    var yy = date.getFullYear();
    var startDate = yy+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = yy+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = date.getDay();
    var dayName = days[d];
    var mode = (d>0&&d<6)?'on':'off';
    if(mode == 'on') {
        var attendances = await Attendance.find({
            year: yy,
            month: mm,
            date: {
                $gte:  startDate,
                $lt:  endDate
            }}).exec();
        for(var i=0; i<attendances.length; i++) {
            var tm1 = attendances[i].arrivalTime;
            var tm2 = attendances[i].leavingTime;
            if(attendances[i].mode =='holiday') {
                //Nothing
            } else {
                if(tm1==tm2) {
                    attendances[i].leaveType = 'FD';
                    attendances[i].isPaid = false;
                    attendances[i].isApproved = false;
                } else {
                    var t1 = tm1.split(':');
                    var t11 = parseInt(t1[0])*60+parseInt(t1[1]);
                    var t2 = tm2.split(':');
                    var t21 = parseInt(t2[0])*60+parseInt(t2[1]);
                    var mins = t21-t11;
                    var lType;
                    if (mins>470) {
                        lType = 'W';
                    } else if (mins<=470 && mins >420) {
                        lType = 'SL';
                    } else if (mins>=240 && mins <420) {
                        lType = 'HD';
                    } else {
                        lType = 'FD';
                    }
                    attendances[i].leaveType = lType;
                    if(lType=='W') {
                        attendances[i].isPaid = true;
                        attendances[i].isApproved = true;
                    } else {
                        attendances[i].isPaid = false;
                        attendances[i].isApproved = false;
                    }
                }
                attendances[i].save(function(err, atten) {
                    //console.log("Error in save", err);
                });
            }
        }
        console.log('Running a task 10:00 PM Every Day');
    } else {
        console.log('Running a task 10:00 PM Every Day on off day');
    }
});

//Running a task 10:20 PM == 16:50 of server Every Day
cron.schedule('50 16 * * *', async () => {
    var date = new Date();
    var dd = date.getDate();
    var mm = (date.getMonth()+1);
    var yy = date.getFullYear();
    var startDate = yy+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T00:00:00.000Z';
    var endDate = yy+'-'+(mm<10?('0'+mm):mm)+'-'+(dd<10?('0'+dd):dd)+'T23:59:59.000Z';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = date.getDay();
    var dayName = days[d];
    var mode = (d>0&&d<6)?'on':'off';
    if(mode == 'on') {
        var attendances = await Attendance.find({
            year: yy,
            month: mm,
            date: {
                $gte:  startDate,
                $lt:  endDate
            }}).exec();
        for(var i=0; i<attendances.length; i++) {
            var tm1 = attendances[i].arrivalTime;
            var tm2 = attendances[i].leavingTime;
            if(attendances[i].mode =='holiday') {
                //Nothing
            } else {
                if(tm1==tm2) {
                    attendances[i].leaveType = 'FD';
                    attendances[i].isPaid = false;
                    attendances[i].isApproved = false;
                } else {
                    var t1 = tm1.split(':');
                    var t11 = parseInt(t1[0])*60+parseInt(t1[1]);
                    var t2 = tm2.split(':');
                    var t21 = parseInt(t2[0])*60+parseInt(t2[1]);
                    var mins = t21-t11;
                    var lType;
                    if (mins>470) {
                        lType = 'W';
                    } else if (mins<=470 && mins >420) {
                        lType = 'SL';
                    } else if (mins>=240 && mins <420) {
                        lType = 'HD';
                    } else {
                        lType = 'FD';
                    }
                    attendances[i].leaveType = lType;
                    if(lType=='W') {
                        attendances[i].isPaid = true;
                        attendances[i].isApproved = true;
                    } else {
                        attendances[i].isPaid = false;
                        attendances[i].isApproved = false;
                    }
                }
                attendances[i].save(function(err, atten) {
                    //console.log("Error in save", err);
                });
            }
        }
        console.log('Running a task 10:20 PM Every Day');
    } else {
        console.log('Running a task 10:20 PM Every Day on off day');
    }
});

//Running a task Every 1 of month at 8:00 AM
cron.schedule('30 2 1 * *', async () => {
    //console.log("Earned leave object created ", new Date().toISOString())
    var date = new Date();
    var month = date.getMonth()+1;
    var year = date.getFullYear();
    var mTitle = GlobalConfig.monthsName[month-1];
    var users = await User.find({userId: { $ne: 0} }).exec();
    var ids = [];
    for(var i=0; i<users.length; i++) {
        await Leave.findOne({ user: users[i]._id, year: year }, function(err, item) {
            if( !item ) {
                ids.push(users[i].userId);
                var l = new Leave({
                    user: users[i]._id,
                    year: year
                });
                l.save(function(err, leave) {
                    if(err) {
                        errs.push(err);
                    }
                })
            }
        });
    }
    console.log("Earned leave object created for the month "+ mTitle +", "+year+" for users "+ ids);
});
