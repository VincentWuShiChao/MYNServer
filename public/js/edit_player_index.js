function submit(){
    var pid = document.getElementById("pid"); //selectid
    var name = document.getElementById("name"); //selectid
    var integral = document.getElementById("integral"); //selectid
    var universal = document.getElementById("universal"); //selectid
    var time = document.getElementById("time"); //selectid
    var logintype = document.getElementById("logintype"); //selectid
    var level = document.getElementById("level"); //selectid
    var exper = document.getElementById("exper"); //selectid
    var json_player={"pid":parseInt(pid.value),"name":name.value,"integral":parseInt(integral.value),"universal":universal.value,"time":time.value,"logintype":parseInt(logintype.value),"level":parseInt(level.value),"exper":parseInt(exper.value)};

  $.post('http://localhost:6001/BSM/editPlayerSubmit',json_player,function (data,status) {
      data=JSON.parse(data);
      alert(data.msg);
      if(data.msg===1){
        var r=confirm("修改成功");
        if(r==true){
          window.location.replace("http://localhost:6000/BSM/edit_data");
        }

      }else{
        alert("更新失败");
      }

    });
  }