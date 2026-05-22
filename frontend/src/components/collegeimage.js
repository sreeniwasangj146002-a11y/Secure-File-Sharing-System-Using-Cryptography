import React from 'react'
import "../photos/college-75535_1920.jpg"
const Collegeimage = () => {
  return (
    <div>
    <div>collegeimage</div>
    <div>
    <img src={require("../photos/college-75535_1920.jpg")} alt="Logo" className="logo-img" style={{width:"100%" ,height:"50%"}} />
    </div>
    </div>
  )
}

export default Collegeimage