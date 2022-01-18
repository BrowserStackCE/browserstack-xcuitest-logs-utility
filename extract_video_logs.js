const https = require("https");
var fs = require("fs");
const { exec } = require("child_process");

function create_folder(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function download_file(url, file_name) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(file_name);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
        resolve(file_name);
      });
    });
  });
}

async function get_api(path) {
  var auth = `${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}`;
  const url = `https://api-cloud.browserstack.com/${path}`;
  return new Promise((resolve) => {
    https.get(url, { auth }, (res) => {
      var data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
    });
  });
}

function extract_device_os_with_sessionid(build_data) {
  var result = [];
  build_data.devices.map((data) => {
    data.sessions.map((session) => {
      result.push({
        device: data.device,
        os: data.os,
        os_version: data.os_version,
        session_id: session.id,
      });
    });
  });
  return result;
}

(async () => {
  var build_id = process.argv[2];
  //get build specific data
  var build_data = JSON.parse(
    await get_api(`app-automate/xcuitest/v2/builds/${build_id}`)
  );
  if (build_data.id) {
    //extract all session ids with devices
    var device_session_mapping = extract_device_os_with_sessionid(build_data);

    //extract all session ids with video url and time range
    var sessionid_videourl_mapping = [];
    await Promise.all(
      device_session_mapping.map(async (data) => {
        var session_details = JSON.parse(
          await get_api(
            `app-automate/xcuitest/builds/${build_id}/sessions/${data.session_id}`
          )
        );
        var class_details = [];
        var video_url = "";
        Object.keys(session_details.test_details).map((key1, index) => {
          var class_data = session_details.test_details[key1];
          var testcase_details = [];
          Object.keys(class_data).map((key2, index) => {
            var test_data = class_data[key2];
            if (!video_url) {
              video_url = test_data.video.substring(
                0,
                test_data.video.lastIndexOf("#")
              );
            }
            var timerange = test_data.video.substring(
              test_data.video.lastIndexOf("#") + 3
            );
            var [start_time, end_time] = timerange.split(",");
            testcase_details.push({
              name: key2,
              start_time,
              end_time,
            });
          });
          class_details.push({
            class: key1.substring(0, key1.indexOf("/")),
            testcase_details,
          });
        });
        sessionid_videourl_mapping.push({
          session_id: data.session_id,
          video_url,
          class_details,
        });
      })
    );

    //download and trim videos
    create_folder(`./${build_id}`);
    sessionid_videourl_mapping.map(async (data) => {
      create_folder(`./${build_id}/${data.session_id}`);
      await download_file(
        data.video_url,
        `./${build_id}/${data.session_id}/video.mp4`
      );
      data.class_details.map((class_data) => {
        create_folder(`./${build_id}/${data.session_id}/${class_data.class}`);
        class_data.testcase_details.map((testcase_data) => {
          var start_time = testcase_data.start_time;
          var end_time = testcase_data.end_time;
          var input_video = `./${build_id}/${data.session_id}/video.mp4`;
          var output_video = `./${build_id}/${data.session_id}/${class_data.class}/${testcase_data.name}.mp4`;
          var ffmpeg_command = `ffmpeg -i ${input_video} -vf trim=${start_time}:${end_time},setpts=PTS-STARTPTS ${output_video} -y`;
          exec(ffmpeg_command, (error, stdout, stderr) => {
            if (error) {
              console.log(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              console.log(`stderr: ${stderr}`);
              return;
            }
            console.log(`Video clipped at ${output_video}`);
          });
        });
      });
    });

    console.log(JSON.stringify(sessionid_videourl_mapping));
  } else {
    console.log("No build found");
  }
})();
