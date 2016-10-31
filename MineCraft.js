/**
 * Created by qq456cvb on 6/20/16.
 */

var DEBitmapLoader = {
    BASE64_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    abgr2rgba: function(data)
    {
        var batch = [];
        batch.length = 4;
        for (var i = 0; i < data.length; i += 4) {

            batch[0] = data[i];
            batch[1] = data[i + 1];
            batch[2] = data[i + 2];
            batch[3] = data[i + 3];

            var alpha = data[i];
            batch.shift();
            batch.push(alpha);

            data[i] = batch[2];
            data[i + 1] = batch[1];
            data[i + 2] = batch[0];
            data[i + 3] = batch[3];
        }
        return data;
    },

    readSize : function (data) {
        var bmd = Bitmap.createBitmapData(1, 1);
        var output = bmd.getPixels(bmd.rect);
        output.clear();
        var dataBuffer = [];
        dataBuffer.length = 4;
        var outputBuffer = [];
        outputBuffer.length = 3;
        var cnt = 0;
        var buffer = [];
        buffer.length = 8;
        for (var i = 0; i < data.length; i += 4) {
            for (var j = 0; j < 4 && i + j < data.length; j++) {
                dataBuffer[j] = this.BASE64_CHARS.indexOf(data.charAt(i + j));
            }

            outputBuffer[0] = (dataBuffer[0] << 2) + ((dataBuffer[1] & 0x30) >> 4);
            outputBuffer[1] = ((dataBuffer[1] & 0x0f) << 4) + ((dataBuffer[2] & 0x3c) >> 2);
            outputBuffer[2] = ((dataBuffer[2] & 0x03) << 6) + dataBuffer[3];
            for (var k = 0; k < outputBuffer.length; k++) {
                if (dataBuffer[k + 1] == 64) break;
                if (cnt >= 18 && cnt < 26) { // skip bmp header
                    buffer[cnt-18] = outputBuffer[k];
                }
                if (cnt >= 26) {
                    // assume little endian
                    var width = buffer[0] + (buffer[1] << 8 & 0xff00) + (buffer[2] << 16 & 0xff0000) + (buffer[3] << 24 & 0xff000000);
                    var height = buffer[4] + (buffer[5] << 8 & 0xff00) + (buffer[6] << 16 & 0xff0000) + (buffer[7] << 24 & 0xff000000);
                    // height is negative
                    height = -height;

                    return {
                        width  : width,
                        height : height
                    };
                }
                cnt++;
            }
        }
        return null;
    },
    extract: function (data) {
        var bmd = Bitmap.createBitmapData(1, 1);
        var output = bmd.getPixels(bmd.rect);
        output.clear();
        var dataBuffer = [];
        dataBuffer.length = 4;
        var outputBuffer = [];
        outputBuffer.length = 3;
        var cnt = 0;
        for (var i = 0; i < data.length; i += 4) {
            for (var j = 0; j < 4 && i + j < data.length; j++) {
                dataBuffer[j] = this.BASE64_CHARS.indexOf(data.charAt(i + j));
            }

            // attention, bgr to rgb convertion!
            outputBuffer[0] = (dataBuffer[0] << 2) + ((dataBuffer[1] & 0x30) >> 4);
            outputBuffer[1] = ((dataBuffer[1] & 0x0f) << 4) + ((dataBuffer[2] & 0x3c) >> 2);
            outputBuffer[2] = ((dataBuffer[2] & 0x03) << 6) + dataBuffer[3];
            for (var k = 0; k < outputBuffer.length; k++) {
                if (dataBuffer[k + 1] == 64) break;
                if (cnt >= 54) { // skip bmp header
                    //if (cnt % 3 == 1) {
                    //    output.writeByte(255); // add alpha channel
                    //};
                    output.writeByte(outputBuffer[k]);
                }
                cnt++;
            }
        }
        output = this.abgr2rgba(output);
        output.position = 0;
        return output;
    },

    loadBitmapData: function (raw) {
        var size = this.readSize(raw);
        var bmd = Bitmap.createBitmapData(size.width, size.height);
        bmd.setPixels(bmd.rect, this.extract(raw));
        return bmd;
    },

    createBitmap: function (bitmapData, lifeTime, scale, parent) {
        var bmp = Bitmap.createBitmap({
            bitmapData: bitmapData,
            lifeTime: lifeTime,
            parent: parent,
            scale: scale
        });
        return bmp;
    }
};

// var bmd = Bitmap.createBitmapData(2, 2);
// var R = 0xFFFF0000;
// var G = 0xFF00FF00;
// var B = 0xFF0000FF;

function logMatrix(mat) {
    for (var i = 0; i < 4; i++) {
        trace(mat.rawData[i] + " " + mat.rawData[i+4] + " " + mat.rawData[i+8] + " " + mat.rawData[i+12]);
    }
    trace("");
}

function logVector(vec) {
    trace(vec.x + " " + vec.y + " " + vec.z + " " + vec.w);
    trace("");
}

/***********************************************************************/
function resetObject(object, param) {
    ScriptManager.popEl(object);
    if (param && param.parent) param.parent.addChild(object);
    else $.root.addChild(object);
    object.transform.matrix3D = null;
    return object;
}
/***********************************************************************/
function setParameters(object, param) {
    foreach(param,
        function(key, val) {
            if (object.hasOwnProperty(key)) object['' + key] = val;
        });
}
/***********************************************************************/
function eraseParameters(param, filter) {
    var newParam = {};
    foreach(param,
        function(key, val) {
            if (!filter.hasOwnProperty(key)) newParam['' + key] = val;
        });
    return newParam;
}


function createCanvas(param) {
    var object = resetObject($.createCanvas({
        lifeTime: 0
    }), param);
    setParameters(object, eraseParameters(param, {
        parent: 0
    }));
    return object;
}

var Global = {
    Renderer : {
        CurrentTexture : {},
        ViewMatrix : $.createMatrix3D([]),
        ProjectionMatrix : $.createMatrix3D([]),
        NormedTriangles : []
    },
    Canvas : {
        Main : {}
    },
    Bitmap : {
        Grass : "Qk02EAAAAAAAADYAAAAoAAAAIAAAAOD///8BACAAAAAAAAAQAACmDgAApg4AAAAAAAAAAAAALIdI/yyPSP8skUj/LIRI/yyPSf8slkj/LJNI/yyQSP8skUj/LYZJ/y2CSv8sj0j/LYdJ/y59Sv8tkEn/LJVI/yyMSf8skEj/LYdJ/y2ISv8sikn/LItI/yyLSf8sj0n/LJRI/yyPSP8tjUn/LYtJ/yyTSP8tiUn/LYNK/y2KSf8skUj/LJVI/yyVSP8sj0j/LIxJ/yyLSP8siEj/LJdI/yyNSP8skkj/LJNI/yyMSf8sjEj/LI9I/yyQSP8slkj/LJNI/yyVSP8sj0j/LIxI/yyKSf8sjkn/LJFJ/yyTSP8slUj/LItI/y2GSf8slEj/LJJI/yyLSP8sjEj/LI9J/yyQSP8skEj/LI5I/y2HSf8tjUn/LJdI/yyNSP8slkj/LJFI/yyTSP8sjkj/LI5I/yyQSf8slkj/LJVI/yyDSP8siEj/LIhI/yx+SP8shUj/LIhI/y19Sf8teEn/LI9I/yyGSP8siEj/LI5I/yyLSP8sjEj/LIZI/yx+SP8sikj/LnpK/yyOSP8skUj/LI5I/yyPSP8sk0j/LI5I/yyQSP8slUj/LIpI/yyHSP8tikn/LIxJ/yyYSP8skEj/LJRI/yyRSP8tgEr/LH9I/yyDSP8sh0j/LItJ/yyNSP8siEj/LINI/yyESP8skkj/LIFJ/yyJSP8sjEn/LIhI/y2HSf8teUn/LIxI/yyMSP8siUj/LIpI/yyUSP8slkj/LJVI/yyZSP8skkj/LI1I/yyMSP8skEj/LJJI/yyXSP8si0j/LJFI/yyISP8si0j/LJJI/yyJSP8tikn/LIhI/yx8SP8siUj/LI9I/yyLSP8slUj/LJBI/yyFSP8sikj/LIhI/yyMSP8slEj/LJhI/yyVSP8skkj/LJlI/yqaRf8qnUb/LJlI/yySSP8slUj/LJRI/yySSP8sjEj/LJJI/yyKSP8skUj/LIVI/yyUSP8skEn/LI5I/yyLSP8sgkj/LYlJ/yyKSf8slEj/LJZI/yyWSP8sj0j/LYdJ/yyGSP8si0j/LHlJ/y1/Sv8sk0j/LJBI/yyVSP8qmET/LKBI/yygSP8plkP/LJNI/yyVSP8skUj/LJBI/yyTSP8sikj/LJNI/yyUSP8smEj/LJJI/yyQSP8skUj/LYBJ/y2ISf8ti0n/LYRK/zWcTv8ynkv/LIxI/y2DSf8siEj/LI1I/yyLSf8tg0r/LJJI/yycSP8smEj/LJtI/yqYRP8soEj/LZ9I/ymTQ/8slEj/LJdI/yyRSP8sikj/LJVI/yyTSP8smkj/LJRI/yybSP8slkj/LJVI/yyVSP8skEj/LIdI/yyLSP8tiUn/NJ1N/zWcTf8sjEn/LIlI/yyNSP8shEj/LYRJ/y2HSv8thUr/LJRI/yyNSP8sh0j/LJRI/yqbRf8qk0L/LJdI/yyOSP8smUj/LI1I/yySSP8sjUj/LJFI/yyYSP8slEj/LJNI/yyLSP8sl0j/LJNI/yyUSP8sj0j/LJZI/yyYSP8slEj/LJpI/yyWSP8skkj/LJBI/yyMSP8thUn/L3JM/y5vS/8si0j/LHRI/yyESP8siUj/LI1J/yyOSf8tjkn/LHtI/yyISP8sbUr/LIxI/yyOSP8sk0f/LIhI/yySSP8sh0j/LJpI/yyMSP8slkj/LJJI/yyMSP8slkj/LIxI/yyISP8sh0j/LI1I/yyKSP8thkn/LWhJ/y15Sf8xT0//LnRL/yx+SP8tZEn/LIxI/yx8SP8sh0j/LXdJ/yx6SP8sfEj/LHRI/yyCSP8siUj/LH9I/yx/SP8sikj/LI1I/yyXSP8si0j/LH9I/yyRSP8tgUn/LI1I/yySSP8sg0n/LIlJ/y2GSf8sjkj/LIdI/yyASP8tcUn/L2dL/zJPUP8xSk//LlZJ/y1uSP8shkj/LXxK/yx6SP8td0n/LHtI/y1uSP8se0j/LIRI/yxwSP8sOEj/LG5I/yxySP8sl0j/LJdI/yxySP8scUj/LIZJ/yyLSf8siEn/KYtB/yiDPv8sfEj/LIlI/yyQSP8siEj/LXVJ/y5RS/8yOU//NDtS/zM6Uf8tS0j/LGlI/y9fS/8uckr/LWlK/yxQSP8sXEj/L1FK/yxtSP8sfUj/LFFI/zA3TP8tdkn/LIhI/yySSP8ua0v/LjxL/y5ySv8sf0j/LYdJ/yyOSP8ndTv/KIE+/yx4Sf8sc0j/LIRI/yx8SP8uZEr/MDdN/zI4Tv80O1L/MjlQ/zE3Tv8tO0n/LmJK/y2ESf8sWEj/LzVK/y40Sf8uNEn/LHBI/yx7SP8uNUr/MjlP/y5jSv8shEj/LG1I/zI5UP8uO0n/LXhK/y13Sf8sjkj/LIdJ/zBETv8xTk//MUhN/y1xSf8sgEj/LllK/y9GS/8yOE7/MjhO/zQ7Uv80O1L/MDZM/zA2TP8tbEn/LI1I/y1aSf8tNEj/LTNI/y0zR/8tV0n/LGhI/zI5UP8xOE3/LWJK/y5qS/8wPUz/MTdO/zA2TP8uVUr/LHRJ/yyESP8tekn/MD5M/zI5T/8yOVD/L19M/y2CSf8uTEr/MDZM/zE4Tv8yOU//NDtS/zI5UP8wN03/MThO/y1FSP8siEj/LIRI/y06SP8uNUr/MDdM/y5GSv8vR0v/MDdO/y0zSP8tYEj/MFlO/zE3Tf8wN03/MDZM/y41Sv8uZ0v/LWlJ/y5qSv8yOU//MjlP/zQ7Uv8wWkz/LW5K/zA2TP8wN0z/MThO/zI5UP80O1L/MTdN/zM6Uf8wN0z/LTtJ/yxwSP8se0j/L0ZK/y40Sf8zOlH/LjVK/zE4Tv8vNUr/MDdN/y48S/8wSE3/MjlQ/zE3Tf8xN03/MDdN/zA9TP8tbUr/M0FR/zM6Uf8wN0z/MTdO/zE/Tv8vUUv/MjlP/zE4Tf8wN0z/MThN/zE3Tf8xN03/MzpR/y82S/8wN03/MThO/y5RSv8uO0n/JSo2/zM6UP8vNUv/LjVJ/zA2TP8vNkv/LzVL/zA3Tv8xOE7/MTdN/zE4Tv8xOE//MDZM/y5YS/8wN0z/LzZK/y81S/8vNUr/LzZL/y82S/8uNEr/MThO/zE4Tv8xN03/MThO/zI4Tv8xOE//LzZL/zE4Tv8xN03/LzVK/y40Sf8vNUr/MjlQ/zE3Tf8vNUv/MjlP/y40Sv8vNUn/LjRJ/zA3TP8wN03/MzpR/zE4T/8wNkz/MThO/y81Sv8wNkz/MjlQ/zM6Uf8xOE//MDZM/y82S/8vNkv/MTdN/zE4Tv8yOU//MThN/zE4Tv8yOE//MTdN/zE3Tf8uNEr/LjVK/zA3TP8xOE3/MDdM/zE4Tv8wN0z/LjRJ/y81S/8vNUr/MThO/zI5T/8zOlH/MTdN/zA3TP8yOVD/MDZL/x4eIP8eHh7/Hh4e/x4eH/8xOE7/LzVL/zE4Tf8xOE7/MThN/zM6Uf8xOE3/MThO/zA2TP8uNEr/MTdN/zA3TP8uNEr/MjlP/zE4Tv8wNkv/MTdN/zA3Tf8wNkz/LzZM/zI5UP8vNkr/MjlP/zM6UP8wN0z/MDdM/zE4T/8xOE7/Hh4f/3l5fP95eXz/Hh4e/zM6Uf8xN07/LzZM/zE4Tv8xOE7/MjlP/zA3TP8xN03/MDdO/y40Sf80O1L/MjlQ/zA2S/8wNkz/MDdM/zE3Tf8xOE7/MTdN/y81S/8yOVD/MjhP/y82S/8xOE7/MDdL/y82S/8wN0z/MThO/zI5T/8eHh7/eXl8/3l5fP8eHh7/MzpR/zA3Tf8vNkz/MDdM/zI5UP8yOU//LzZL/zA3TP8wN07/LzZM/zQ7Uv8wN03/MDZM/zE4Tv8xN03/MjlP/zI4T/8xN03/MThN/zI4T/8xOE7/MDdM/y82S/8vNUv/LzZL/zA3TP8xOE7/MjlP/x4eHv8eHh7/Hh4e/x4eHv8xOE//MDdN/zE4Tv8wN0z/MjlP/zI4Tv8wN03/MDdM/zE4Tf8wN0z/MDZM/zA3Tf8yOU//NDtS/zE4Tv8xOE3/MDdN/zQ7Uv8yOE//MThO/zE4Tf8wN03/LjRJ/y82S/8xOE7/MDdN/zE4Tf8zOVD/MzlQ/zQ7Uv8zOlH/MzpQ/zE4Tf8wN03/MThO/zA3TP8yOE//MjlP/zA3TP8wN03/MjlQ/zA2TP9iZGz/MDdM/zE4Tv8xN03/MjlP/zE4Tv80O1L/NDtS/zI4Tv8xOE7/MjlQ/zA3TP8tNEj/MDdN/zE3TP8wN0z/MDdM/zE4T/8zOlD/MzpR/zI4Tv8vNkv/LzZK/zA3Tv8xOE7/MTdN/zE3Tf8xOE7/MThO/zI5UP8yOVD/LzZL/zA3Tf8wN0z/MTdN/zA3Tf8yOE//NDtS/zI5T/80O1L/MThO/zE4Tf8wN03/MDZM/y40Sf8xN03/MThO/zA2S/8wN0z/MTdO/zA3Tf8yOU//MDZM/zI5T/8wNkv/MThN/zE3Tv8yOVD/MThO/zE3Tf8xN03/MThN/zE4Tv8vNUr/MDdN/zE4T/8vNkz/MThO/zE3Tf8vNkv/MjlP/zA3TP8yOVD/Vllj/zI4Tv8wN0z/LzZL/zA2TP8wN0z/LzZK/zE4Tv8xOE7/MTdO/zI4T/8yOE//MzpR/zE3Tf8yOU//MDdL/zI5UP8yOE//MThO/zE3Tf8wN0z/MDdM/y82S/8yOU//MDdN/y82S/8vNkv/MThO/y41Sv8uNEn/LjRK/zE3Tf8yOVD/MThO/zI5UP8wN03/LzZL/zE4Tv8yOU//MThP/zA3Tf8xOE//MThO/zE4Tv8yOU//MjlQ/21tc/8xN03/MjhP/zI5T/8yOVD/MTdN/zA3TP8xOE7/MjlQ/zI4T/8wN0z/MDZM/zE3Tf8wNkz/MDZL/y82S/8yOU//MjhP/zA3Tf80O1L/MjlQ/zI4T/8wNkz/MTdN/zI5T/8wN07/MThN/zE4Tv8yOU//MjlP/zQ7Uv8yOVD/MThO/zE4Tv8xOE7/MThO/zE4Tv8yOU//MThN/zI5UP80O1L/MzpR/zA2TP8vNUr/LjRJ/zE4T/8zOlH/MThO/zE4Tv8xOE7/MThN/zI4T/8yOVD/MjlQ/zE4Tf8xOE7/MjlP/zE4T/8vNkv/MDZM/zA3Tf8yOVD/NDtS/zI4T/8xOE7/NDtS/zM6Uf8xOE7/MThO/zQ7Uv8yOU//MzpQ/zI5T/8yOU//MThP/zA3TP8yOVD/NDtS/zQ7Uv8xOE7/MjhP/zE4Tv80O1L/MjhP/zI4T/8yOVD/MThO/zI5T/8yOU//MTdN/zA3Tf8wN03/MThO/zI4T/8yOVD/MDdN/zI4T/8yOU//MzpR/zI5T/80O1L/MzpR/zI5T/8yOU//MzpR/zQ7Uv80O1L/NDtS/zQ7Uv80O1L/NDtS/zE4Tv8yOU//NDtS/zQ7Uv80O1L/MjhP/zI5UP80O1L/MjlP/zA3Tf8yOE//NDtS/zE3Tf8zOlH/MjlQ/zE4Tv8yOVD/MThO/zI4Tv8yOU//MjlP/w=="
    },
    Texture : {
        Grass : {}
    },
    Player : {
        Eye : {},
        Direction : {}
    }
};

var ObjPool = {
    objects : [],
    Create : function() {
        var obj = {
            Destroy : function() {
                var index = ObjPool.objects.indexOf(this);
                ObjPool.objects.splice(index, 1);
            },
            __internal : {
                collidedObjects : []
            }
        };
        this.objects.push(obj);
        return obj;
    }
};

function getViewMatrix(target, eye, up) {
    var zaxis = $.createVector3D(eye.x-target.x,eye.y-target.y,eye.z-target.z,eye.w-target.w);
    zaxis.normalize();
    // logVector(zaxis);
    var xaxis = up.crossProduct(zaxis);
    xaxis.normalize();
    // logVector(xaxis);
    var yaxis = zaxis.crossProduct(xaxis);
    var translation = $.createMatrix3D([]);
    translation.appendTranslation(-eye.x, -eye.y, -eye.z);
    var view = $.createMatrix3D([
        xaxis.x, yaxis.x, zaxis.x, 0,
        xaxis.y, yaxis.y, zaxis.y, 0,
        xaxis.z, yaxis.z, zaxis.z, 0,
        0, 0, 0, 1
    ]);
    // view.transpose();
    // logMatrix(translation);
    translation.append(view);

    return translation;
}
function getProjectionMatrix(viewAngle, aspect, zn, zf) {
    var projection;

    // assume central frustum
    var r = Math.tan(viewAngle) * zn;
    var t = r * aspect;

    projection = $.createMatrix3D([
        zn/r, 0, 0, 0,
        0, zn/t, 0, 0,
        0, 0, -(zf+zn)/(zf-zn), -2*zf*zn/(zf-zn),
        0, 0, -1., 0
    ]);
    projection.transpose();
    // logMatrix(projection);
    return projection;
}

function normToUV(norm) {
    var temp = {};
    temp.x = norm.x * Player.width / 2. + Player.width / 2.;
    temp.y = Player.height / 2. - norm.y * Player.height / 2.;
    return temp;
}

function fillTriangle(g, p, uv, depth) {
    // bmd.setVector(bmd.rect, $.toUIntVector([c[0], c[1], c[2], (c[1]+c[2]) >> 1]));
    trace(3);
    g.graphics.beginBitmapFill(Global.Renderer.CurrentTexture,null,false,false /* =smooth */ );

    g.graphics.drawTriangles(
        // x,y -coordinates
        $.toNumberVector([
            p[0].x, p[0].y,
            p[1].x, p[1].y,
            p[2].x, p[2].y]),
        // indices
        $.toIntVector([0,1,2]),
        // texture coordinates
        $.toNumberVector([uv[0][0],uv[0][1],depth[0], uv[1][0],uv[1][1],depth[1], uv[2][0],uv[2][1],depth[2]])
    );
}

function swap(triangles, a, b) {
    var temp = triangles[a];
    triangles[a] = triangles[b];
    triangles[b] = temp;
}
function sortTriangles(triangles, l, h) {
    if (l >= h) return;
    var k = l+1;
    var i = l, j = h;
    while (k < h) {
        if (triangles[l].z > triangles[k].z) {
            swap(triangles, l, k);
            l++;
            k++;
        } else {
            k++;
        }
        if (triangles[h].z < triangles[k].z) {
            swap(triangles, h, k);
            h--;
        }
    }
    sortTriangles(triangles, i, l-1);
    sortTriangles(triangles, k+1, j);
}

function TrianglePrimitive(triangleMesh) {
    var primitive = {};
    primitive.mesh = triangleMesh;
    primitive.ModelMatrix = $.createMatrix3D([]);
    // normalize to screen space
    primitive.normalize = function () {
        var cnt = 0;
        while (cnt < this.mesh.v.length) {
            var triangle = {};
            var disgard = false;
            triangle.points = [];
            triangle.pointsRaw = [];
            triangle.uv = [];
            triangle.depth = [];
            triangle.pointsScreen = [];
            triangle.z = 0;
            for (var i = 0; i < 3; i++) {
                var idx = this.mesh.v[i+cnt];
                var objToWorldMatrix = this.mesh.ModelMatrix;
                objToWorldMatrix.append(this.ModelMatrix);
                var modelPoints = $.projectVector(objToWorldMatrix, this.mesh.p[idx]);
                var camPoints = $.projectVector(Global.Renderer.ViewMatrix, modelPoints);
                var uvPoints = $.projectVector(Global.Renderer.ProjectionMatrix, camPoints);
                uvPoints.project();
                if (uvPoints.z < -1.0 || uvPoints.z > 1.0) {
                    disgard = true;
                    break;
                }
                triangle.z += uvPoints.z;
                triangle.depth.push(1 / uvPoints.w);
                triangle.pointsScreen.push(normToUV(uvPoints));
                triangle.points.push(uvPoints);
                triangle.pointsRaw.push(this.mesh.p[idx]);
                triangle.uv.push(this.mesh.uv[i+cnt]);
            }
            cnt = cnt+3;
            if (disgard == false) {
                triangle.primitive = this;
                Global.Renderer.NormedTriangles.push(triangle);
            }
        }
    };
    primitive.render = function (g) {
        var cnt = 0;
        var pt = [], uv = [], depth = [];
        pt.length = 3;
        uv.length = 3;
        depth.length = 3;
        while (cnt < this.mesh.v.length) {
            for (var i = 0; i < 3; i++) {
                var idx = this.mesh.v[i+cnt];
                var objToWorldMatrix = this.mesh.ModelMatrix;
                objToWorldMatrix.append(this.ModelMatrix);
                var modelPoints = $.projectVector(objToWorldMatrix, this.mesh.p[idx]);
                var camPoints = $.projectVector(Global.Renderer.ViewMatrix, modelPoints);
                var uvPoints = $.projectVector(Global.Renderer.ProjectionMatrix, camPoints);
                depth[i] = 1 / (uvPoints.w);
                uvPoints.project();
                pt[i] = normToUV(uvPoints);
                uv[i] = this.mesh.uv[i+cnt];
            }
            cnt = cnt+3;
            fillTriangle(g, pt, uv, depth);
        }
    };
    return primitive;
}

function TriangleMesh(p, v, uv) {

    var mesh = {};

    mesh.p = p;
    mesh.v = v;
    mesh.uv = uv;

    mesh.ModelMatrix = $.createMatrix3D([]);

    mesh.render = function (g) {
        // var cnt = 0;
        // var pt = [], uv = [];
        // pt.length = 3;
        // uv.length = 3;
        // while (cnt < this.v.length) {
        //     for (var i = 0; i < 3; i++) {
        //         var idx = this.v[i+cnt];
        //         var modelPoints = $.projectVector(this.ModelMatrix, this.p[idx]);
        //         var camPoints = $.projectVector(Global.Renderer.ViewMatrix, modelPoints);
        //         var uvPoints = $.projectVector(Global.Renderer.ProjectionMatrix, camPoints);
        //         uvPoints.project();
        //         pt[i] = normToUV(uvPoints);
        //         uv[i] = this.uv[i+cnt];
        //
        //     }
        //     cnt = cnt+3;
        //     fillTriangle(g, pt, uv);
        // }
    };
    return mesh;
}

var EventManager = {
    RenderFrame : function () {
        Global.Renderer.CurrentTexture = Global.Texture.Grass;
        Global.Canvas.Main.graphics.clear();
        Global.Canvas.Main.graphics.beginFill(0x87CEEB); // choosing the colour for the fill, here it is red
        Global.Canvas.Main.graphics.drawRect(0, 0, Player.width,Player.height); // (x spacing, y spacing, width, height)
        Global.Canvas.Main.graphics.endFill();

        Global.Renderer.NormedTriangles.length = 0;

        for (var i = 0; i < ObjPool.objects.length; i++) {
            ObjPool.objects[i].normalize();
        }

        sortTriangles(Global.Renderer.NormedTriangles, 0, Global.Renderer.NormedTriangles.length-1);


        for (var i = 0; i < Global.Renderer.NormedTriangles.length; i++) {
            // trace(Global.Renderer.NormedTriangles[i].pointsScreen[0].x);
            fillTriangle(Global.Canvas.Main,
                Global.Renderer.NormedTriangles[i].pointsScreen,
                Global.Renderer.NormedTriangles[i].uv,
                Global.Renderer.NormedTriangles[i].depth);
        }

    },
    MouseMove : function (e) {
        var u = e.localX / Player.width;
        var v = 1 - e.localY / Player.height;
        u = 2 * u - 1;
        v = 2 * v - 1;
        Global.Player.Direction = $.createVector3D(u, v, -1, 0);
        Global.Player.Direction.normalize();
        Global.Renderer.ViewMatrix = getViewMatrix(Global.Player.Eye.add(Global.Player.Direction), Global.Player.Eye, $.createVector3D(0, 1, 0, 0));
    }
};

function keyDown(key) {
    if (key == 87 || key == 38) {
        var step = Global.Player.Direction.clone();
        step.scaleBy(0.05);
        Global.Player.Eye.incrementBy(step);
        Global.Renderer.ViewMatrix = getViewMatrix(Global.Player.Eye.add(Global.Player.Direction), Global.Player.Eye, $.createVector3D(0, 1, 0, 0));
    } else if (key == 83 || key == 40) {
        var step = Global.Player.Direction.clone();
        step.scaleBy(0.05);
        Global.Player.Eye.decrementBy(step);
        Global.Renderer.ViewMatrix = getViewMatrix(Global.Player.Eye.add(Global.Player.Direction), Global.Player.Eye, $.createVector3D(0, 1, 0, 0));
    } else if (key == 65 || key == 37) {
        var zaxis = $.createVector3D(-Global.Player.Direction.x,-Global.Player.Direction.y,-Global.Player.Direction.z,1.0);
        zaxis.normalize();
        var up = $.createVector3D(0, 1, 0, 0);
        var xaxis = up.crossProduct(zaxis);
        xaxis.normalize();
        xaxis.scaleBy(0.05);
        Global.Player.Eye.decrementBy(xaxis);
        Global.Renderer.ViewMatrix = getViewMatrix(Global.Player.Eye.add(Global.Player.Direction), Global.Player.Eye, $.createVector3D(0, 1, 0, 0));
    } else if (key == 68 || key == 39) {
        var zaxis = $.createVector3D(-Global.Player.Direction.x,-Global.Player.Direction.y,-Global.Player.Direction.z,1.0);
        zaxis.normalize();
        var up = $.createVector3D(0, 1, 0, 0);
        var xaxis = up.crossProduct(zaxis);
        xaxis.normalize();
        xaxis.scaleBy(0.05);
        Global.Player.Eye.incrementBy(xaxis);
        Global.Renderer.ViewMatrix = getViewMatrix(Global.Player.Eye.add(Global.Player.Direction), Global.Player.Eye, $.createVector3D(0, 1, 0, 0));
    }
}

function Triangle(points, colors) {
    var obj = ObjPool.Create();
    obj.points = points;
    obj.colors = colors;
    obj.ModelMatrix = $.createMatrix3D([]);
    return obj;
}

function init() {
    ScriptManager.clearTimer();
    ScriptManager.clearEl();
    ScriptManager.clearTrigger();
    Global.Canvas.Main = createCanvas({
        x: 0,
        y: 0,
        lifeTime: 0
    });

    $.frameRate = 30;
    Player.keyTrigger(function(key){
        keyDown(key);
    }, 1<<31 -1);

    Global.Texture.Grass = DEBitmapLoader.loadBitmapData(Global.Bitmap.Grass);
    Global.Renderer.CurrentTexture = Global.Texture.Grass;

    $.root.addEventListener("enterFrame", EventManager.RenderFrame);
    $.root.addEventListener("mouseMove", function (e) {
        EventManager.MouseMove(e);
    });
    $.root.mouseEnabled = true;
    Global.Player.Eye = $.createVector3D(0, 0, 1., 1.);
    Global.Player.Direction = $.createVector3D(0, 0, -1., 0);
    Global.Renderer.ViewMatrix = getViewMatrix(Global.Player.Eye.add(Global.Player.Direction), Global.Player.Eye, $.createVector3D(0, 1., 0, 0));
    Global.Renderer.ProjectionMatrix = getProjectionMatrix(Math.PI/4, Player.height / Player.width, 0.1, 100.);

    var plane = TriangleMesh([$.createVector3D(0.5, 0, 0, 1.), $.createVector3D(0.5, 1., 0, 1.), $.createVector3D(-0.5, 1., 0, 1.), $.createVector3D(-0.5, 0, 0, 1.)],
        [3, 0, 1, 1, 3, 2], [[0,0], [1,0], [1,1], [1,1], [0,0], [0,1]]);

    var cube = TrianglePrimitive(plane);

    ObjPool.objects.push(cube);

}

init();