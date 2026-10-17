package com.mikkytrionze.nkst.church.api.response;

import com.mikkytrionze.nkst.church.application.dto.ChurchDTO;
import com.mikkytrionze.nkst.pastor.application.dto.PastorDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class ChurchResponse {
    private Long id;
    private String name;
    private String address;
    private String telNumber;
    private String emailAddress;
    private ChurchDTO parentChurch;
    private List<PastorDTO> pastors;
    private List<ChurchDTO> subChurches;
}
